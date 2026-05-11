import { useEffect, useRef, useState } from "react";
import { startPrediction, getPredictionStatus } from "./api";
import SearchForm from "./components/SearchForm";
import PredictionCard from "./components/PredictionCard";

const POLL_INTERVAL_MS = 2000;

export default function App() {
  const [loading, setLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => () => stopPolling(), []);

  async function handleSubmit(ticker, horizonDays) {
    stopPolling();
    setError(null);
    setJobStatus(null);
    setLoading(true);

    try {
      const { job_id } = await startPrediction(ticker, horizonDays);

      pollRef.current = setInterval(async () => {
        try {
          const status = await getPredictionStatus(job_id);
          setJobStatus(status);

          if (status.status === "complete" || status.status === "error") {
            stopPolling();
            setLoading(false);
            if (status.status === "error") {
              setError(status.error ?? "Prediction failed.");
            }
          }
        } catch (err) {
          stopPolling();
          setLoading(false);
          setError(err.message);
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  }

  const progressPct = jobStatus ? Math.round(jobStatus.progress * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white">Stock Return Predictor</h1>
          <p className="text-slate-400 mt-2 text-sm">
            LSTM deep learning · 2 years of daily OHLCV data · Polygon.io
          </p>
        </header>

        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <SearchForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {loading && jobStatus && (
          <div className="bg-slate-800 rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-300">{jobStatus.message}</span>
              <span className="text-sm font-mono text-emerald-400">{progressPct}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(progressPct, 4)}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/40 border border-red-700 rounded-2xl p-5 mb-6 text-red-300 text-sm">
            <span className="font-semibold">Error: </span>{error}
          </div>
        )}

        {jobStatus?.status === "complete" && jobStatus.result && (
          <div className="bg-slate-800 rounded-2xl p-6">
            <PredictionCard result={jobStatus.result} />
          </div>
        )}
      </div>
    </div>
  );
}
