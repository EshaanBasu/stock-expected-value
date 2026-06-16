import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd

from .polygon_client import fetch_daily_bars
from .return_model import predict_annual_return
from .portfolio import estimate_covariance, search_optimal_portfolios


@dataclass
class Job:
    id: str
    tickers: list[str]
    k: int
    horizon_days: int
    status: str = "queued"
    progress: float = 0.0
    message: str = ""
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


_jobs: dict[str, Job] = {}


def create_job(tickers: list[str], k: int, horizon_days: int) -> str:
    job_id = str(uuid.uuid4())
    _jobs[job_id] = Job(id=job_id, tickers=tickers, k=k, horizon_days=horizon_days)
    return job_id


def get_job(job_id: str) -> Optional[Job]:
    return _jobs.get(job_id)


async def run_optimization_job(job_id: str, api_key: str) -> None:
    import asyncio

    job = _jobs[job_id]
    loop = asyncio.get_event_loop()

    try:
        job.status = "fetching"
        job.message = f"Fetching 2 years of data for {len(job.tickers)} tickers..."

        n = len(job.tickers)
        job.message = f"Fetching 2 years of data for {n} tickers (concurrent)…"
        job.progress = 0.10

        async def fetch_one(ticker: str) -> tuple[str, list[dict]]:
            bars = await fetch_daily_bars(ticker, days=730)
            if len(bars) < 100:
                raise ValueError(f"{ticker}: only {len(bars)} trading days available.")
            return ticker, bars

        pairs = await asyncio.gather(*[fetch_one(t) for t in job.tickers])
        bars_by_ticker: dict[str, list[dict]] = dict(pairs)

        job.status = "optimizing"
        job.message = "Running portfolio optimization..."
        job.progress = 0.35

        result = await loop.run_in_executor(None, _optimize, job, bars_by_ticker)

        job.status = "complete"
        job.result = result
        job.progress = 1.0
        job.message = "Done"

    except Exception as exc:
        job.status = "error"
        job.error = str(exc)
        job.message = f"Error: {exc}"


def _optimize(job: Job, bars_by_ticker: dict[str, list[dict]]) -> dict:
    tickers = job.tickers
    horizon = job.horizon_days

    # Build aligned price DataFrame
    dfs = {}
    for ticker, bars in bars_by_ticker.items():
        df = pd.DataFrame(bars).set_index("date")
        df.index = pd.to_datetime(df.index)
        dfs[ticker] = df["close"].astype(float)

    prices = pd.DataFrame(dfs).sort_index().dropna()
    if len(prices) < 100:
        raise ValueError("Not enough overlapping trading days across all tickers.")

    # Daily log returns matrix
    log_ret = np.log(prices / prices.shift(1)).dropna().values  # shape (T, n)

    # ML: Ridge regression predicts expected annualized return per ticker
    job.message = "Predicting expected returns (Ridge regression)..."
    mean_returns = np.array([
        predict_annual_return(prices[t], horizon_days=horizon)
        for t in tickers
    ], dtype=np.float64)

    # Ledoit-Wolf shrinkage covariance estimate
    job.message = "Estimating covariance matrix (Ledoit-Wolf)..."
    cov = estimate_covariance(log_ret)

    import math
    n, k = len(tickers), job.k
    n_combos = math.comb(n, k)
    job.message = f"Searching {n_combos} combinations of {k} assets..."

    top_portfolios = search_optimal_portfolios(tickers, mean_returns, cov, log_ret, k)

    # Recent 1-year price history for each ticker (for charting)
    price_history = {
        t: [
            {"date": str(idx.date()), "close": round(float(val), 2)}
            for idx, val in prices[t].iloc[-252:].items()
        ]
        for t in tickers
    }

    return {
        "tickers": tickers,
        "k": k,
        "n_combinations_searched": n_combos,
        "expected_returns": {t: round(float(r), 4) for t, r in zip(tickers, mean_returns)},
        "top_portfolios": top_portfolios,
        "price_history": price_history,
    }
