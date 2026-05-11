import os

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .predictor import create_job, get_job, run_prediction_job

load_dotenv()

app = FastAPI(title="Stock Return Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=10)
    horizon_days: int = Field(default=30, ge=5, le=365)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/predict", status_code=202)
async def start_prediction(req: PredictRequest, background_tasks: BackgroundTasks):
    api_key = os.environ.get("POLYGON_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="POLYGON_API_KEY is not configured on the server.")

    ticker = req.ticker.upper().strip()
    job_id = create_job(ticker, req.horizon_days)
    background_tasks.add_task(run_prediction_job, job_id, api_key)
    return {"job_id": job_id}


@app.get("/api/predict/{job_id}")
def get_prediction_status(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    payload: dict = {
        "job_id": job.id,
        "ticker": job.ticker,
        "status": job.status,
        "progress": round(job.progress, 3),
        "message": job.message,
    }
    if job.status == "complete":
        payload["result"] = job.result
    elif job.status == "error":
        payload["error"] = job.error

    return payload
