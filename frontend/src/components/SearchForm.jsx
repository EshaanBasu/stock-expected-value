import { useState, useRef, useEffect } from "react";

const SECTOR_COLORS = {
  Technology:    "bg-blue-900/50 text-blue-300",
  Finance:       "bg-emerald-900/50 text-emerald-300",
  Healthcare:    "bg-pink-900/50 text-pink-300",
  Consumer:      "bg-orange-900/50 text-orange-300",
  Energy:        "bg-yellow-900/50 text-yellow-300",
  Industrials:   "bg-slate-700 text-slate-300",
  Entertainment: "bg-purple-900/50 text-purple-300",
  Utilities:     "bg-teal-900/50 text-teal-300",
  ETF:           "bg-indigo-900/50 text-indigo-300",
};

const TOP_STOCKS = [
  { ticker: "AAPL",  name: "Apple Inc.",              sector: "Technology" },
  { ticker: "MSFT",  name: "Microsoft Corp.",          sector: "Technology" },
  { ticker: "NVDA",  name: "NVIDIA Corp.",             sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.",            sector: "Technology" },
  { ticker: "META",  name: "Meta Platforms",           sector: "Technology" },
  { ticker: "AMZN",  name: "Amazon.com",               sector: "Consumer" },
  { ticker: "TSLA",  name: "Tesla Inc.",               sector: "Technology" },
  { ticker: "AVGO",  name: "Broadcom Inc.",            sector: "Technology" },
  { ticker: "NFLX",  name: "Netflix Inc.",             sector: "Entertainment" },
  { ticker: "AMD",   name: "Advanced Micro Devices",   sector: "Technology" },
  { ticker: "CRM",   name: "Salesforce Inc.",          sector: "Technology" },
  { ticker: "ORCL",  name: "Oracle Corp.",             sector: "Technology" },
  { ticker: "ADBE",  name: "Adobe Inc.",               sector: "Technology" },
  { ticker: "QCOM",  name: "Qualcomm Inc.",            sector: "Technology" },
  { ticker: "INTC",  name: "Intel Corp.",              sector: "Technology" },
  { ticker: "NOW",   name: "ServiceNow",               sector: "Technology" },
  { ticker: "INTU",  name: "Intuit Inc.",              sector: "Technology" },
  { ticker: "CRWD",  name: "CrowdStrike Holdings",     sector: "Technology" },
  { ticker: "PLTR",  name: "Palantir Technologies",    sector: "Technology" },
  { ticker: "SHOP",  name: "Shopify Inc.",             sector: "Technology" },
  { ticker: "UBER",  name: "Uber Technologies",        sector: "Technology" },
  { ticker: "JPM",   name: "JPMorgan Chase",           sector: "Finance" },
  { ticker: "BAC",   name: "Bank of America",          sector: "Finance" },
  { ticker: "GS",    name: "Goldman Sachs",            sector: "Finance" },
  { ticker: "MS",    name: "Morgan Stanley",           sector: "Finance" },
  { ticker: "V",     name: "Visa Inc.",                sector: "Finance" },
  { ticker: "MA",    name: "Mastercard Inc.",          sector: "Finance" },
  { ticker: "BLK",   name: "BlackRock Inc.",           sector: "Finance" },
  { ticker: "SPGI",  name: "S&P Global",              sector: "Finance" },
  { ticker: "PYPL",  name: "PayPal Holdings",         sector: "Finance" },
  { ticker: "COIN",  name: "Coinbase Global",         sector: "Finance" },
  { ticker: "UNH",   name: "UnitedHealth Group",      sector: "Healthcare" },
  { ticker: "LLY",   name: "Eli Lilly & Co.",         sector: "Healthcare" },
  { ticker: "JNJ",   name: "Johnson & Johnson",       sector: "Healthcare" },
  { ticker: "ABBV",  name: "AbbVie Inc.",             sector: "Healthcare" },
  { ticker: "MRK",   name: "Merck & Co.",             sector: "Healthcare" },
  { ticker: "PFE",   name: "Pfizer Inc.",             sector: "Healthcare" },
  { ticker: "TMO",   name: "Thermo Fisher Scientific",sector: "Healthcare" },
  { ticker: "ABT",   name: "Abbott Laboratories",     sector: "Healthcare" },
  { ticker: "AMGN",  name: "Amgen Inc.",              sector: "Healthcare" },
  { ticker: "WMT",   name: "Walmart Inc.",            sector: "Consumer" },
  { ticker: "COST",  name: "Costco Wholesale",        sector: "Consumer" },
  { ticker: "PG",    name: "Procter & Gamble",        sector: "Consumer" },
  { ticker: "KO",    name: "Coca-Cola Co.",           sector: "Consumer" },
  { ticker: "PEP",   name: "PepsiCo Inc.",            sector: "Consumer" },
  { ticker: "MCD",   name: "McDonald's Corp.",        sector: "Consumer" },
  { ticker: "HD",    name: "Home Depot",              sector: "Consumer" },
  { ticker: "SBUX",  name: "Starbucks Corp.",         sector: "Consumer" },
  { ticker: "ABNB",  name: "Airbnb Inc.",             sector: "Consumer" },
  { ticker: "XOM",   name: "ExxonMobil Corp.",        sector: "Energy" },
  { ticker: "CVX",   name: "Chevron Corp.",           sector: "Energy" },
  { ticker: "COP",   name: "ConocoPhillips",          sector: "Energy" },
  { ticker: "CAT",   name: "Caterpillar Inc.",        sector: "Industrials" },
  { ticker: "DE",    name: "Deere & Company",         sector: "Industrials" },
  { ticker: "GE",    name: "GE Aerospace",            sector: "Industrials" },
  { ticker: "BA",    name: "Boeing Co.",              sector: "Industrials" },
  { ticker: "LMT",   name: "Lockheed Martin",         sector: "Industrials" },
  { ticker: "RTX",   name: "RTX Corp.",               sector: "Industrials" },
  { ticker: "DIS",   name: "Walt Disney Co.",         sector: "Entertainment" },
  { ticker: "CMCSA", name: "Comcast Corp.",           sector: "Entertainment" },
  { ticker: "NEE",   name: "NextEra Energy",          sector: "Utilities" },
  { ticker: "SPY",   name: "S&P 500 ETF (SPDR)",     sector: "ETF" },
  { ticker: "QQQ",   name: "Nasdaq-100 ETF",          sector: "ETF" },
  { ticker: "GLD",   name: "Gold ETF (SPDR)",         sector: "ETF" },
];

const HORIZON_PRESETS = [
  { label: "1 Month",  days: 30 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
];

function comb(n, k) {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

export default function SearchForm({ onSubmit, loading }) {
  const [selected, setSelected] = useState(new Set());
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [k, setK] = useState(3);
  const [horizonDays, setHorizonDays] = useState(30);
  const containerRef = useRef(null);

  useEffect(() => {
    function onMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const q = query.trim().toUpperCase();

  const filtered = TOP_STOCKS.filter((s) => {
    if (!query) return true;
    return (
      s.ticker.includes(q) ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.sector.toLowerCase().includes(query.toLowerCase())
    );
  });

  const isCustom = q.length > 0 && !TOP_STOCKS.some((s) => s.ticker === q);

  function toggle(ticker) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) {
        next.delete(ticker);
      } else if (next.size < 12) {
        next.add(ticker);
      }
      return next;
    });
  }

  function addCustom() {
    if (!q || selected.size >= 12) return;
    toggle(q);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isCustom) addCustom();
    }
    if (e.key === "Escape") setOpen(false);
  }

  const selectedList = [...selected];
  const effectiveK = Math.min(k, selectedList.length);

  function handleSubmit(e) {
    e.preventDefault();
    if (selectedList.length < 2) return;
    onSubmit(selectedList, effectiveK, horizonDays);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selected chips */}
      {selectedList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedList.map((t) => {
            const stock = TOP_STOCKS.find((s) => s.ticker === t);
            return (
              <span
                key={t}
                className="flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-700 border border-slate-600 text-white"
              >
                {t}
                {stock && <span className="text-slate-400 font-normal hidden sm:inline">· {stock.sector}</span>}
                <button
                  type="button"
                  onClick={() => toggle(t)}
                  disabled={loading}
                  className="text-slate-400 hover:text-red-400 ml-0.5 leading-none"
                >
                  ×
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            disabled={loading}
            className="text-xs text-slate-500 hover:text-red-400 px-2 py-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Searchable dropdown */}
      <div ref={containerRef} className="relative">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Stock Universe
          <span className="text-slate-500 font-normal ml-2">
            {selectedList.length}/12 selected
          </span>
        </label>

        <div
          className={`flex items-center gap-2 bg-slate-700 border rounded-lg px-4 py-3 transition-all ${
            open ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-slate-600"
          }`}
        >
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name, ticker, or sector…"
            disabled={loading}
            className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm disabled:opacity-50"
          />
          {isCustom && (
            <button
              type="button"
              onClick={addCustom}
              disabled={selected.size >= 12 || loading}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:opacity-40 whitespace-nowrap"
            >
              + Add {q}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            disabled={loading}
            className="text-slate-400 hover:text-slate-200 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {open && (
          <div className="absolute z-30 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
            {filtered.length === 0 && !isCustom && (
              <p className="text-slate-400 text-sm p-4 text-center">No results for "{query}"</p>
            )}
            {isCustom && (
              <button
                type="button"
                onClick={addCustom}
                disabled={selected.size >= 12}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700 border-b border-slate-700 disabled:opacity-40"
              >
                <div className="w-4 h-4 rounded border border-dashed border-emerald-500 flex-shrink-0" />
                <span className="font-mono font-bold text-sm text-emerald-400">{q}</span>
                <span className="text-slate-400 text-sm">Custom ticker — press Enter or click to add</span>
              </button>
            )}
            {filtered.map((stock) => {
              const isSelected = selected.has(stock.ticker);
              const sectorColor = SECTOR_COLORS[stock.sector] ?? "bg-slate-700 text-slate-300";
              return (
                <button
                  key={stock.ticker}
                  type="button"
                  onClick={() => toggle(stock.ticker)}
                  disabled={!isSelected && selected.size >= 12}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors disabled:opacity-40 ${
                    isSelected ? "bg-slate-700" : "hover:bg-slate-750 hover:bg-slate-700/50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${
                      isSelected ? "bg-emerald-500 border-emerald-500" : "border-slate-500"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-mono font-bold text-sm text-white w-14 flex-shrink-0">{stock.ticker}</span>
                  <span className="text-slate-300 text-sm flex-1 truncate">{stock.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${sectorColor}`}>
                    {stock.sector}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* k slider */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Portfolio Size —{" "}
          <span className="text-emerald-400 font-bold">best {effectiveK}-asset combination</span>
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={2}
            max={Math.min(6, Math.max(2, selectedList.length))}
            value={effectiveK}
            onChange={(e) => setK(Number(e.target.value))}
            disabled={loading}
            className="flex-1 accent-emerald-500"
          />
          <span className="text-3xl font-black font-mono text-emerald-400 w-8 text-center">{effectiveK}</span>
        </div>
        {selectedList.length >= 2 && (
          <p className="text-xs text-slate-400 mt-1">
            Searching C({selectedList.length},{effectiveK}) ={" "}
            <span className="text-slate-200 font-mono">{comb(selectedList.length, effectiveK).toLocaleString()}</span>{" "}
            combinations
          </p>
        )}
      </div>

      {/* Horizon */}
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
                horizonDays === p.days
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || selectedList.length < 2}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {loading
          ? "Optimizing…"
          : selectedList.length < 2
          ? "Select at least 2 stocks"
          : `Find Optimal ${effectiveK}-Asset Portfolios`}
      </button>
    </form>
  );
}
