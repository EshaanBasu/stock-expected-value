import { useState } from "react";

const PRESETS = [
  { label: "FAANG+", value: "META, AAPL, AMZN, NFLX, GOOGL, MSFT, NVDA" },
  { label: "Blue Chips", value: "JPM, JNJ, PG, KO, WMT, V, UNH" },
  { label: "Growth", value: "TSLA, NVDA, AMD, SHOP, CRWD, PLTR, COIN" },
];

const HORIZON_PRESETS = [
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
];

export default function SearchForm({ onSubmit, loading }) {
  const [tickerInput, setTickerInput] = useState("");
  const [k, setK] = useState(3);
  const [horizonDays, setHorizonDays] = useState(30);

  const parsedTickers = tickerInput
    .split(/[,\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  function handleSubmit(e) {
    e.preventDefault();
    if (parsedTickers.length < 2) return;
    onSubmit(parsedTickers, Math.min(k, parsedTickers.length), horizonDays);
  }

  const maxK = Math.min(6, parsedTickers.length);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Stock Universe <span className="text-slate-500">(2–12 tickers, comma-separated)</span>
        </label>
        <input
          type="text"
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
          placeholder="e.g. AAPL, MSFT, GOOGL, AMZN, NVDA"
          disabled={loading}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 font-mono text-sm"
        />
        <div className="flex gap-2 mt-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setTickerInput(p.value)}
              disabled={loading}
              className="text-xs px-3 py-1 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
        {parsedTickers.length > 0 && (
          <p className="text-xs text-slate-400 mt-2">
            {parsedTickers.length} tickers: {parsedTickers.join(", ")}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Portfolio Size (k) — best {k}-asset combination
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={2}
            max={maxK || 6}
            value={Math.min(k, maxK || 6)}
            onChange={(e) => setK(Number(e.target.value))}
            disabled={loading}
            className="flex-1 accent-emerald-500"
          />
          <span className="text-2xl font-bold font-mono text-emerald-400 w-8">{Math.min(k, maxK || 6)}</span>
        </div>
        {parsedTickers.length >= 2 && (
          <p className="text-xs text-slate-400 mt-1">
            Searching C({parsedTickers.length}, {Math.min(k, maxK)}) ={" "}
            {comb(parsedTickers.length, Math.min(k, maxK)).toLocaleString()} combinations
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Return Horizon</label>
        <div className="flex gap-2">
          {HORIZON_PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setHorizonDays(p.days)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                horizonDays === p.days ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || parsedTickers.length < 2}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {loading ? "Optimizing..." : "Find Optimal Portfolios"}
      </button>
    </form>
  );
}

function comb(n, k) {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}
