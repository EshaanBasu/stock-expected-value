import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatPrice(val) {
  return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm">
      <p className="text-slate-400">{label}</p>
      <p className="text-emerald-400 font-semibold">{formatPrice(payload[0].value)}</p>
    </div>
  );
};

export default function PriceChart({ data, ticker }) {
  // Sample to ~100 points for performance
  const step = Math.max(1, Math.floor(data.length / 100));
  const sampled = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  const prices = sampled.map((d) => d.close);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.05;

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-400 mb-3">
        {ticker} — 1-Year Price History
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={sampled} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#10b981"
            dot={false}
            strokeWidth={1.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
