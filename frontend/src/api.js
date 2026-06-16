const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

export async function startOptimization(tickers, k, horizonDays) {
  const res = await fetch(`${BASE}/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickers, k, horizon_days: horizonDays }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to start optimization");
  }
  return res.json();
}

export async function getOptimizationStatus(jobId) {
  const res = await fetch(`${BASE}/optimize/${jobId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to fetch job status");
  }
  return res.json();
}
