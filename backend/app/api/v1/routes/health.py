"""
Health Check Endpoint.
"""

from fastapi import APIRouter

from app.core.data_store import data_store
from app.schemas.health import HealthResponse



router = APIRouter()

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Application Health",
)
async def health():

    return {
        "status": "healthy",
        "application": "ParkOptic API",
        "datasets_loaded": data_store.is_loaded,
        "datasets": data_store.info(),
    }