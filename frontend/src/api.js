const BASE = "/api";

export async function startPrediction(ticker, horizonDays) {
  const res = await fetch(`${BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, horizon_days: horizonDays }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to start prediction");
  }
  return res.json();
}

export async function getPredictionStatus(jobId) {
  const res = await fetch(`${BASE}/predict/${jobId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Failed to fetch job status");
  }
  return res.json();
}
