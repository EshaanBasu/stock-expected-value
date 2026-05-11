import { useState } from "react";

const HORIZON_PRESETS = [
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
  { label: "1 Year", days: 365 },
];

export default function SearchForm({ onSubmit, loading }) {
  const [ticker, setTicker] = useState("");
  const [horizonDays, setHorizonDays] = useState(30);

  function handleSubmit(e) {
    e.preventDefault();
    const clean = ticker.trim().toUpperCase();
    if (!clean) return;
    onSubmit(clean, horizonDays);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Stock Ticker
        </label>
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="e.g. AAPL, MSFT, TSLA"
          maxLength={10}
          disabled={loading}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-lg font-mono tracking-widest"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">
          Prediction Horizon
        </label>
        <div className="flex gap-2 flex-wrap">
          {HORIZON_PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setHorizonDays(p.days)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                horizonDays === p.days
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Predicts the expected annualized return over the next {horizonDays} trading days
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !ticker.trim()}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors text-base"
      >
        {loading ? "Analyzing..." : "Predict Return"}
      </button>
    </form>
  );
}
