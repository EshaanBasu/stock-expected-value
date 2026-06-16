import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler


def predict_annual_return(close: pd.Series, horizon_days: int = 30) -> float:
    """Ridge regression on rolling return features to predict annualized forward return."""
    log_ret = np.log(close / close.shift(1))

    X_df = pd.DataFrame({
        "ret_5d": log_ret.rolling(5).sum(),
        "ret_10d": log_ret.rolling(10).sum(),
        "ret_20d": log_ret.rolling(20).sum(),
        "ret_60d": log_ret.rolling(60).sum(),
        "vol_20d": log_ret.rolling(20).std(),
        "vol_60d": log_ret.rolling(60).std(),
        "skew_20d": log_ret.rolling(20).skew(),
    })

    label = np.log(close.shift(-horizon_days) / close) * (252.0 / horizon_days)
    combined = pd.concat([X_df, label.rename("y")], axis=1).dropna()

    if len(combined) < 60:
        return float(log_ret.dropna().mean() * 252)

    X = combined.drop("y", axis=1).values.astype(np.float32)
    y = combined["y"].values.astype(np.float32)

    # Clip label outliers to reduce sensitivity to extreme events
    y = np.clip(y, np.percentile(y, 5), np.percentile(y, 95))

    scaler = StandardScaler()
    X_sc = scaler.fit_transform(X)

    model = Ridge(alpha=1.0)
    model.fit(X_sc, y)

    last_clean = X_df.dropna()
    if last_clean.empty:
        return float(log_ret.dropna().mean() * 252)

    x_latest = scaler.transform(last_clean.iloc[[-1]].values.astype(np.float32))
    log_ann = float(model.predict(x_latest)[0])

    return float(np.expm1(log_ann))
