from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.wind import (
    OverviewResponse,
    ForecastsResponse,
    AccuracyResponse,
    VintageHistoryResponse
)
from app.services.analysis_service import AnalysisService
from app.services.ingestion import parse_utc_datetime

router = APIRouter()
analysis_service = AnalysisService()

@router.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "service": "Wind Forecast Intelligence API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/overview", response_model=OverviewResponse, tags=["Analytics"])
async def get_overview(
    month: str = Query("2026-01", pattern=r"^\d{4}-\d{2}$", description="Month format YYYY-MM"),
    cutoff_hour: int = Query(11, ge=0, le=23, description="Day-Ahead cutoff hour UTC"),
    cutoff_minute: int = Query(0, ge=0, le=59, description="Day-Ahead cutoff minute"),
    resolution_mode: str = Query("exact", pattern="^(exact|hourly_block)$", description="exact or hourly_block"),
    force_live: bool = Query(False, description="Force fetching live data from Elexon")
):
    try:
        return await analysis_service.get_overview(
            month=month,
            cutoff_hour=cutoff_hour,
            cutoff_minute=cutoff_minute,
            resolution_mode=resolution_mode,
            force_live=force_live
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate overview: {str(exc)}"
        )

@router.get("/forecasts", response_model=ForecastsResponse, tags=["Analytics"])
async def get_forecasts(
    date: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Filter by date YYYY-MM-DD"),
    month: str = Query("2026-01", pattern=r"^\d{4}-\d{2}$"),
    cutoff_hour: int = Query(11, ge=0, le=23),
    cutoff_minute: int = Query(0, ge=0, le=59),
    resolution_mode: str = Query("exact", pattern="^(exact|hourly_block)$"),
    force_live: bool = Query(False)
):
    try:
        return await analysis_service.get_forecasts(
            date_filter=date,
            month=month,
            cutoff_hour=cutoff_hour,
            cutoff_minute=cutoff_minute,
            resolution_mode=resolution_mode,
            force_live=force_live
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve interval forecasts: {str(exc)}"
        )

@router.get("/accuracy", response_model=AccuracyResponse, tags=["Analytics"])
async def get_accuracy(
    month: str = Query("2026-01", pattern=r"^\d{4}-\d{2}$"),
    cutoff_hour: int = Query(11, ge=0, le=23),
    cutoff_minute: int = Query(0, ge=0, le=59),
    resolution_mode: str = Query("exact", pattern="^(exact|hourly_block)$"),
    force_live: bool = Query(False)
):
    try:
        return await analysis_service.get_accuracy(
            month=month,
            cutoff_hour=cutoff_hour,
            cutoff_minute=cutoff_minute,
            resolution_mode=resolution_mode,
            force_live=force_live
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compute accuracy metrics: {str(exc)}"
        )

@router.get("/vintages", response_model=VintageHistoryResponse, tags=["Audit"])
async def get_interval_vintages(
    delivery_start: str = Query(..., description="ISO 8601 UTC delivery timestamp, e.g. 2026-01-15T14:00:00Z"),
    cutoff_hour: int = Query(11, ge=0, le=23),
    cutoff_minute: int = Query(0, ge=0, le=59),
    force_live: bool = Query(False)
):
    try:
        dt = parse_utc_datetime(delivery_start)
        return await analysis_service.get_interval_vintages(
            delivery_start=dt,
            cutoff_hour=cutoff_hour,
            cutoff_minute=cutoff_minute,
            force_live=force_live
        )
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid timestamp format: {str(val_err)}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve vintage details: {str(exc)}"
        )
