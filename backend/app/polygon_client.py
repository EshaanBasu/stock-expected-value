import asyncio
from datetime import date, timedelta
from typing import Optional

import pandas as pd
import yfinance as yf


async def fetch_daily_bars(
    ticker: str,
    days: int = 730,
    api_key: Optional[str] = None,  # unused — kept for interface compatibility
) -> list[dict]:
    return await asyncio.to_thread(_fetch_sync, ticker.upper(), days)


def _fetch_sync(ticker: str, days: int) -> list[dict]:
    start = (date.today() - timedelta(days=days)).isoformat()
    end = date.today().isoformat()

    df = yf.Ticker(ticker).history(
        start=start,
        end=end,
        interval="1d",
        auto_adjust=True,
    )

    if df.empty:
        raise ValueError(
            f"No data found for '{ticker}'. Check the ticker symbol."
        )

    df = df.dropna(subset=["Close"])

    return [
        {
            "date": str(idx.date()),
            "open": float(row["Open"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "close": float(row["Close"]),
            "volume": float(row["Volume"]),
        }
        for idx, row in df.iterrows()
    ]
