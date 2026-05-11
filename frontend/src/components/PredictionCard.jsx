import PriceChart from "./PriceChart";

function formatPct(val) {
  const sign = val >= 0 ? "+" : "";
  return `${sign}${(val * 100).toFixed(1)}%`;
}

function riskLevel(volatility) {
  if (volatility < 0.15) return { label: "Low", color: "text-emerald-400", bg: "bg-emerald-900/40 border-emerald-700" };
  if (volatility < 0.30) return { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-900/40 border-yellow-700" };
  return { label: "High", color: "text-red-400", bg: "bg-red-900/40 border-red-700" };
}

function ReturnBadge({ label, value, highlight }) {
  const positive = value >= 0;
  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p
        className={`text-xl font-bold font-mono ${
          highlight
            ? positive
              ? "text-emerald-400"
              : "text-red-400"
            : "text-slate-200"
        }`}
      >
        {formatPct(value)}
      </p>
      <p className="text-xs text-slate-500 mt-1">annualized</p>
    </div>
  );
}

function MetricBox({ label, value, sub, valueClass }) {
  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function PredictionCard({ result }) {
  const {
    ticker,
    horizon_days,
    predicted_annualized_return,
    historical_median_return,
    historical_std,
    current_price,
    annualized_volatility,
    sharpe_ratio,
    max_drawdown,
    data_points,
    training_samples,
    price_history,
  } = result;

  const positive = predicted_annualized_return >= 0;
  const vsMedian = predicted_annualized_return - historical_median_return;
  const risk = riskLevel(annualized_volatility);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{ticker}</h2>
          <p className="text-slate-400 text-sm mt-1">
            Over next {horizon_days} days &nbsp;·&nbsp; Current price{" "}
            <span className="text-slate-200 font-mono">${current_price.toLocaleString()}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Predicted annualized return</p>
          <p
            className={`text-4xl font-black font-mono mt-1 ${
              positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatPct(predicted_annualized_return)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ReturnBadge
          label="LSTM Prediction"
          value={predicted_annualized_return}
          highlight
        />
        <ReturnBadge
          label="Historical Median"
          value={historical_median_return}
          highlight={false}
        />
        <div className="bg-slate-700 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">vs. Historical Median</p>
          <p
            className={`text-xl font-bold font-mono ${
              vsMedian >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatPct(vsMedian)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            ±{formatPct(historical_std)} hist. σ
          </p>
        </div>
      </div>

      <div className={`rounded-lg border p-4 ${risk.bg}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-200">Risk Assessment</h3>
          <span className={`text-xs font-bold px-2 py-1 rounded-full border ${risk.bg} ${risk.color}`}>
            {risk.label} Risk
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricBox
            label="Annualized Volatility"
            value={formatPct(annualized_volatility)}
            sub="std of daily returns"
            valueClass={risk.color}
          />
          <MetricBox
            label="Sharpe Ratio"
            value={sharpe_ratio.toFixed(2)}
            sub="return / volatility"
            valueClass={
              sharpe_ratio >= 1 ? "text-emerald-400" :
              sharpe_ratio >= 0 ? "text-yellow-400" : "text-red-400"
            }
          />
          <MetricBox
            label="Max Drawdown"
            value={formatPct(max_drawdown)}
            sub="worst peak-to-trough"
            valueClass="text-red-400"
          />
        </div>
      </div>

      {price_history?.length > 0 && (
        <PriceChart data={price_history} ticker={ticker} />
      )}

      <p className="text-xs text-slate-500 border-t border-slate-700 pt-4">
        Model trained on {data_points} data points ({training_samples} sequences).
        This is a machine learning estimate for educational purposes only — not
        financial advice. Past patterns do not guarantee future results.
      </p>
    </div>
  );
}
