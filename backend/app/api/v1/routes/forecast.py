"""Forecast API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.core.settings import settings
from app.repositories.forecast_repository import forecast_repository
from app.schemas.forecast import ForecastRecord, ForecastSummary


router = APIRouter()


@router.get(
    "",
    response_model=list[ForecastRecord],
    summary="Forecast Predictions",
)
async def get_forecasts(
    limit: int = Query(default=100, ge=1, le=settings.MAX_PAGE_SIZE),
    offset: int = Query(default=0, ge=0),
):
    return forecast_repository.all(limit=limit, offset=offset)


@router.get(
    "/summary",
    response_model=ForecastSummary,
    summary="Forecast Summary",
)
async def forecast_summary():
    return forecast_repository.summary()


@router.get(
    "/{h3_index}",
    response_model=list[ForecastRecord],
    summary="Forecast Predictions For H3 Cell",
)
async def get_forecast_by_h3(h3_index: str):
    results = forecast_repository.get_by_h3(h3_index)

    if not results:
        raise HTTPException(status_code=404, detail="Forecast not found.")

    return results
