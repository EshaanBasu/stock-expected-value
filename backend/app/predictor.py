import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

from .polygon_client import fetch_daily_bars
from .features import compute_features, build_sequences
from .lstm_model import StockLSTM, train_model, predict

SEQ_LEN = 30


@dataclass
class Job:
    id: str
    ticker: str
    horizon_days: int
    status: str = "queued"
    progress: float = 0.0
    message: str = ""
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


_jobs: dict[str, Job] = {}


def create_job(ticker: str, horizon_days: int) -> str:
    job_id = str(uuid.uuid4())
    _jobs[job_id] = Job(id=job_id, ticker=ticker, horizon_days=horizon_days)
    return job_id


def get_job(job_id: str) -> Optional[Job]:
    return _jobs.get(job_id)


async def run_prediction_job(job_id: str, api_key: str) -> None:
    import asyncio

    job = _jobs[job_id]
    loop = asyncio.get_event_loop()

    try:
        job.status = "fetching"
        job.message = f"Fetching 2 years of daily data for {job.ticker}..."
        bars = await fetch_daily_bars(job.ticker, days=730, api_key=api_key)

        if len(bars) < 100:
            raise ValueError(
                f"Only {len(bars)} trading days available — need at least 100."
            )

        df = pd.DataFrame(bars).set_index("date")
        df.index = pd.to_datetime(df.index)
        df = df.astype(float)

        job.status = "training"
        job.message = "Computing technical indicators..."

        result = await loop.run_in_executor(None, _train_and_predict, job, df)

        job.status = "complete"
        job.result = result
        job.progress = 1.0
        job.message = "Done"

    except Exception as exc:
        job.status = "error"
        job.error = str(exc)
        job.message = f"Error: {exc}"


def _train_and_predict(job: Job, df: pd.DataFrame) -> dict:
    horizon = job.horizon_days
    close = df["close"]

    feat_df = compute_features(df)
    log_label = np.log(close.shift(-horizon) / close) * (252.0 / horizon)

    combined = pd.concat([feat_df, log_label.rename("label")], axis=1).dropna()

    if len(combined) < SEQ_LEN + 30:
        raise ValueError(
            f"Not enough clean data ({len(combined)} rows) after computing indicators."
        )

    feature_cols = [c for c in combined.columns if c != "label"]
    X_raw = combined[feature_cols].values.astype(np.float32)
    y_raw = combined["label"].values.astype(np.float32)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_raw)

    # Clip label outliers at ±3 std so extreme events don't dominate the loss
    y_mean, y_std = y_raw.mean(), y_raw.std()
    y_clipped = np.clip(y_raw, y_mean - 3 * y_std, y_mean + 3 * y_std)

    X_seq, y_seq = build_sequences(X_scaled, y_clipped, seq_len=SEQ_LEN)

    split = int(len(X_seq) * 0.8)
    X_train, y_train = X_seq[:split], y_seq[:split]
    X_val = X_seq[split:] if split < len(X_seq) else X_seq[-10:]
    y_val = y_seq[split:] if split < len(y_seq) else y_seq[-10:]

    def _progress(epoch: int, total: int, train_loss: float, val_loss: float) -> None:
        job.progress = epoch / total
        job.message = f"Training epoch {epoch}/{total} — val loss {val_loss:.5f}"

    model = train_model(X_train, y_train, X_val, y_val, progress_callback=_progress)

    log_ann_return = predict(model, X_scaled[-SEQ_LEN:])
    ann_return = float(np.expm1(log_ann_return))

    hist_log = y_raw[-252:] if len(y_raw) >= 252 else y_raw
    hist_simple = np.expm1(hist_log)

    # Risk metrics
    daily_log_returns = np.log(close / close.shift(1)).dropna()
    ann_volatility = float(daily_log_returns.std() * np.sqrt(252))
    sharpe_ratio = round(ann_return / ann_volatility, 3) if ann_volatility > 0 else 0.0
    rolling_max = close.cummax()
    max_drawdown = float(((close - rolling_max) / rolling_max).min())

    price_history = [
        {"date": str(idx.date()), "close": round(float(val), 2)}
        for idx, val in zip(df.index[-365:], close.iloc[-365:])
    ]

    return {
        "ticker": job.ticker,
        "horizon_days": horizon,
        "predicted_annualized_return": round(ann_return, 4),
        "historical_median_return": round(float(np.median(hist_simple)), 4),
        "historical_std": round(float(np.std(hist_simple)), 4),
        "current_price": round(float(close.iloc[-1]), 2),
        "annualized_volatility": round(ann_volatility, 4),
        "sharpe_ratio": round(sharpe_ratio, 3),
        "max_drawdown": round(max_drawdown, 4),
        "data_points": len(combined),
        "training_samples": len(X_train),
        "price_history": price_history,
    }
