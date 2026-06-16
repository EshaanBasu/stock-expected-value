import AllocationChart from "./AllocationChart";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function pct(v, decimals = 1) {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${(v * 100).toFixed(decimals)}%`;
}

function MetricPill({ label, value, color }) {
  return (
    <div className="bg-slate-900 rounded-lg px-3 py-2 text-center">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}

function PortfolioRow({ portfolio, rank }) {
  const { tickers, weights, annual_return, annual_volatility, sharpe_ratio, sortino_ratio, max_drawdown } = portfolio;
  const isTop = rank === 0;

  return (
    <div className={`rounded-xl p-5 border ${isTop ? "border-emerald-600 bg-slate-750" : "border-slate-700 bg-slate-800/60"}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${isTop ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300"}`}>
            #{rank + 1}
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {tickers.map((t, i) => (
              <span
                key={t}
                className="text-xs font-mono font-bold px-2 py-1 rounded"
                style={{ backgroundColor: COLORS[i % COLORS.length] + "33", color: COLORS[i % COLORS.length] }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Sharpe Ratio</p>
          <p className={`text-2xl font-black font-mono ${sharpe_ratio >= 1 ? "text-emerald-400" : sharpe_ratio >= 0 ? "text-yellow-400" : "text-red-400"}`}>
            {sharpe_ratio.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="w-36 flex-shrink-0">
          <AllocationChart weights={weights} />
          <div className="space-y-0.5 mt-1">
            {Object.entries(weights).map(([t, w], i) => (
              <div key={t} className="flex justify-between text-xs">
                <span style={{ color: COLORS[i % COLORS.length] }} className="font-mono font-bold">{t}</span>
                <span className="text-slate-300">{(w * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-2">
          <MetricPill
            label="Annual Return"
            value={pct(annual_return)}
            color={annual_return >= 0 ? "text-emerald-400" : "text-red-400"}
          />
          <MetricPill
            label="Volatility"
            value={pct(annual_volatility)}
            color="text-slate-200"
          />
          <MetricPill
            label="Sortino Ratio"
            value={sortino_ratio.toFixed(2)}
            color={sortino_ratio >= 1 ? "text-emerald-400" : sortino_ratio >= 0 ? "text-yellow-400" : "text-red-400"}
          />
          <MetricPill
            label="Max Drawdown"
            value={pct(max_drawdown)}
            color="text-red-400"
          />
        </div>
      </div>
    </div>
  );
}

export default function PortfolioCard({ result }) {
  const { tickers, k, n_combinations_searched, expected_returns, top_portfolios } = result;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Top {top_portfolios.length} Portfolios</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Searched {n_combinations_searched.toLocaleString()} combinations · best {k}-asset portfolios from {tickers.length} stocks
          </p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-lg p-3">
        <p className="text-xs text-slate-400 mb-2">ML-Predicted Annual Returns (Ridge Regression)</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(expected_returns).map(([t, r]) => (
            <div key={t} className="flex items-center gap-1.5 bg-slate-800 rounded px-2 py-1">
              <span className="text-xs font-mono font-bold text-slate-200">{t}</span>
              <span className={`text-xs font-mono ${r >= 0 ? "text-emerald-400" : "text-red-400"}`}>{pct(r)}</span>
            </div>
          ))}
        </div>
      </div>

      {top_portfolios.map((portfolio, i) => (
        <PortfolioRow key={i} portfolio={portfolio} rank={i} />
      ))}

      <p className="text-xs text-slate-500 border-t border-slate-700 pt-3">
        Expected returns predicted via Ridge regression on rolling technical features. Covariance estimated with Ledoit-Wolf shrinkage.
        Weights maximize Sharpe ratio subject to long-only constraints. For educational purposes only — not financial advice.
      </p>
    </div>
  );
}
