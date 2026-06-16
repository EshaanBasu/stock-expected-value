import os

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .predictor import create_job, get_job, run_optimization_job

load_dotenv()

app = FastAPI(title="Portfolio Optimizer API")

_raw_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _raw_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


class OptimizeRequest(BaseModel):
    tickers: list[str] = Field(..., min_length=2, max_length=12)
    k: int = Field(default=3, ge=2, le=6)
    horizon_days: int = Field(default=30, ge=5, le=252)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/optimize", status_code=202)
async def start_optimization(req: OptimizeRequest, background_tasks: BackgroundTasks):
    api_key = os.environ.get("POLYGON_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="POLYGON_API_KEY is not configured.")

    tickers = [t.upper().strip() for t in req.tickers]
    if len(tickers) < req.k:
        raise HTTPException(status_code=400, detail=f"Need at least {req.k} tickers to form a {req.k}-asset portfolio.")

    job_id = create_job(tickers, req.k, req.horizon_days)
    background_tasks.add_task(run_optimization_job, job_id, api_key)
    return {"job_id": job_id}


@app.get("/api/optimize/{job_id}")
def get_optimization_status(job_id: str):
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    payload: dict = {
        "job_id": job.id,
        "status": job.status,
        "progress": round(job.progress, 3),
        "message": job.message,
    }
    if job.status == "complete":
        payload["result"] = job.result
    elif job.status == "error":
        payload["error"] = job.error

    return payload
