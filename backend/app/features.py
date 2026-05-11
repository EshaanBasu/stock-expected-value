import numpy as np
import pandas as pd
import ta


FEATURE_COLS = [
    "log_return_1d",
    "log_return_5d",
    "log_return_20d",
    "price_sma20_ratio",
    "price_sma50_ratio",
    "rsi",
    "macd_norm",
    "macd_signal_norm",
    "bb_pband",
    "volume_ratio",
    "high_low_ratio",
]


def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    close = df["close"]
    high = df["high"]
    low = df["low"]
    volume = df["volume"]

    feat = pd.DataFrame(index=df.index)

    feat["log_return_1d"] = np.log(close / close.shift(1))
    feat["log_return_5d"] = np.log(close / close.shift(5))
    feat["log_return_20d"] = np.log(close / close.shift(20))

    sma20 = ta.trend.SMAIndicator(close, window=20).sma_indicator()
    sma50 = ta.trend.SMAIndicator(close, window=50).sma_indicator()
    feat["price_sma20_ratio"] = close / sma20 - 1
    feat["price_sma50_ratio"] = close / sma50 - 1

    feat["rsi"] = ta.momentum.RSIIndicator(close, window=14).rsi() / 100.0

    macd_ind = ta.trend.MACD(close)
    feat["macd_norm"] = macd_ind.macd() / close
    feat["macd_signal_norm"] = macd_ind.macd_signal() / close

    bb = ta.volatility.BollingerBands(close, window=20)
    feat["bb_pband"] = bb.bollinger_pband()

    feat["volume_ratio"] = volume / volume.rolling(20).mean()
    feat["high_low_ratio"] = (high - low) / close

    return feat[FEATURE_COLS]


def build_sequences(
    features: np.ndarray,
    labels: np.ndarray,
    seq_len: int = 30,
) -> tuple[np.ndarray, np.ndarray]:
    X, y = [], []
    for i in range(seq_len, len(features)):
        if i < len(labels):
            X.append(features[i - seq_len : i])
            y.append(labels[i])
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)
