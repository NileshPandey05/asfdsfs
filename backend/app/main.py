from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router as api_router, analysis_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("wind_forecast_intelligence")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Wind Forecast Intelligence application...")
    try:
        # Preload data snapshot into memory on startup
        analysis_service.ingestion.load_from_snapshot()
        logger.info("Successfully primed snapshot in memory.")
    except Exception as exc:
        logger.warning("Could not pre-load snapshot on startup: %s", exc)
    yield
    logger.info("Shutting down Wind Forecast Intelligence application.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="UK Electricity Day-Ahead Wind Forecast Accuracy & Intelligence Platform",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local React dev and containerized setups
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "title": "Wind Forecast Intelligence Service",
        "docs": "/docs",
        "health": "/api/health",
        "version": "1.0.0"
    }
