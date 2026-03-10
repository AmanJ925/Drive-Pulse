"""
main.py — DrivePulse FastAPI application entry point.
"""
from __future__ import annotations
import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from services.ingestion import ingest_all
from routers.api import router as api_router
from routers.ws import router as ws_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DrivePulse API",
    version="1.0.0",
    description="Driver Safety & Earnings Insights — Uber Hackathon",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes prefixed with /api
app.include_router(api_router, prefix="/api")
app.include_router(ws_router)   # WS at /stream_sensor_data

# Serve built frontend (Vite outputs to backend/static)
frontend_dir = Path(__file__).parent / "static"
if not frontend_dir.exists():
    # Fallback: legacy index.html location
    frontend_dir = Path(__file__).parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        index = frontend_dir / "index.html"
        if index.exists():
            return FileResponse(str(index))
        return {"error": "Frontend not found"}


@app.on_event("startup")
async def startup():
    logger.info("=== DrivePulse starting ===")
    try:
        report = ingest_all()
        logger.info("Data ingested: %s", report)
    except Exception as exc:
        logger.error("Ingestion error: %s", exc)
    logger.info("=== Ready — docs at http://localhost:8000/docs ===")


@app.get("/api", tags=["Root"])
def api_root():
    return {"service": "DrivePulse API", "version": "1.0.0", "docs": "/docs"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
