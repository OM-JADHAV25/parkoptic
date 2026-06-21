"""
Temporal Intelligence Routes.
"""

from fastapi import APIRouter, Query

from app.schemas.hotspot import MapHotspot
from app.services.temporal_intelligence_service import temporal_intelligence_service

router = APIRouter()

@router.get(
    "/",
    response_model=list[MapHotspot],
    summary="Get Hourly Temporal Hotspots",
)
async def get_temporal_hotspots(
    hour: int = Query(..., ge=0, le=23, description="Hour of the day (0-23)"),
):
    """
    Returns hotspots enriched with temporal intelligence for the specified hour.
    """
    return temporal_intelligence_service.get_hourly_estimates(hour)
