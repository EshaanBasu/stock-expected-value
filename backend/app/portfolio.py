import itertools

import numpy as np
from scipy.optimize import minimize
from sklearn.covariance import LedoitWolf

RISK_FREE_RATE = 0.045


def estimate_covariance(daily_log_returns: np.ndarray) -> np.ndarray:
    """Annualized covariance matrix via Ledoit-Wolf shrinkage."""
    lw = LedoitWolf()
    return lw.fit(daily_log_returns).covariance_ * 252


def max_sharpe_weights(
    mean_returns: np.ndarray,
    cov: np.ndarray,
    rf: float = RISK_FREE_RATE,
) -> np.ndarray:
    n = len(mean_returns)
    w0 = np.ones(n) / n

    def neg_sharpe(w: np.ndarray) -> float:
        ret = float(w @ mean_returns)
        vol = float(np.sqrt(w @ cov @ w))
        return -(ret - rf) / vol if vol > 1e-8 else 0.0

    result = minimize(
        neg_sharpe,
        w0,
        method="SLSQP",
        bounds=[(0.0, 1.0)] * n,
        constraints=[{"type": "eq", "fun": lambda w: w.sum() - 1}],
        options={"ftol": 1e-9, "maxiter": 500},
    )
    return result.x if result.success else w0


def portfolio_metrics(
    weights: np.ndarray,
    mean_returns: np.ndarray,
    cov: np.ndarray,
    daily_log_returns: np.ndarray,
    rf: float = RISK_FREE_RATE,
) -> dict:
    ann_return = float(weights @ mean_returns)
    ann_vol = float(np.sqrt(weights @ cov @ weights))
    sharpe = (ann_return - rf) / ann_vol if ann_vol > 1e-8 else 0.0

    port_daily = daily_log_returns @ weights
    neg = port_daily[port_daily < 0]
    down_vol = float(np.std(neg) * np.sqrt(252)) if len(neg) > 1 else ann_vol
    sortino = (ann_return - rf) / down_vol if down_vol > 1e-8 else 0.0

    cum = np.exp(np.cumsum(port_daily))
    peak = np.maximum.accumulate(cum)
    max_dd = float(np.min((cum - peak) / peak))

    return {
        "annual_return": round(ann_return, 4),
        "annual_volatility": round(ann_vol, 4),
        "sharpe_ratio": round(sharpe, 3),
        "sortino_ratio": round(sortino, 3),
        "max_drawdown": round(max_dd, 4),
    }


def search_optimal_portfolios(
    tickers: list[str],
    mean_returns: np.ndarray,
    cov: np.ndarray,
    daily_log_returns: np.ndarray,
    k: int,
    top_n: int = 5,
) -> list[dict]:
    results = []

    for combo in itertools.combinations(range(len(tickers)), k):
        idx = list(combo)
        sub_tickers = [tickers[i] for i in idx]
        sub_means = mean_returns[idx]
        sub_cov = cov[np.ix_(idx, idx)]
        sub_daily = daily_log_returns[:, idx]

        weights = max_sharpe_weights(sub_means, sub_cov)
        metrics = portfolio_metrics(weights, sub_means, sub_cov, sub_daily)

        results.append({
            "tickers": sub_tickers,
            "weights": {t: round(float(w), 4) for t, w in zip(sub_tickers, weights)},
            **metrics,
        })

    results.sort(key=lambda x: x["sharpe_ratio"], reverse=True)
    return results[:top_n]
