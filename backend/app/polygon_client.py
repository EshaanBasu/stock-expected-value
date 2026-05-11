import os
from datetime import date, timedelta
from typing import Optional

import httpx

POLYGON_BASE_URL = "https://api.polygon.io"


async def fetch_daily_bars(
    ticker: str,
    days: int = 730,
    api_key: Optional[str] = None,
) -> list[dict]:
    if api_key is None:
        api_key = os.environ.get("POLYGON_API_KEY", "")

    end_date = date.today().isoformat()
    start_date = (date.today() - timedelta(days=days)).isoformat()

    url = (
        f"{POLYGON_BASE_URL}/v2/aggs/ticker/{ticker.upper()}"
        f"/range/1/day/{start_date}/{end_date}"
    )
    params = {
        "adjusted": "true",
        "sort": "asc",
        "limit": 50000,
        "apiKey": api_key,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    if data.get("status") == "ERROR":
        raise ValueError(f"Polygon API error: {data.get('error', 'Unknown error')}")

    if not data.get("results"):
        raise ValueError(
            f"No data found for '{ticker}'. Check the ticker symbol and ensure "
            "your Polygon.io free-tier account has access."
        )

    return [
        {
            "date": date.fromtimestamp(r["t"] / 1000).isoformat(),
            "open": r["o"],
            "high": r["h"],
            "low": r["l"],
            "close": r["c"],
            "volume": r["v"],
        }
        for r in data["results"]
    ]
