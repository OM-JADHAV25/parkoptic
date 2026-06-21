"""
Dashboard API Routes.
"""

from fastapi import APIRouter

from app.repositories.dashboard_repository import (dashboard_repository)

from app.schemas.dashboard import (DashboardResponse)

router = APIRouter()


@router.get(
    "",
    response_model=DashboardResponse,
    summary="Dashboard Summary",
)
async def dashboard():
    return dashboard_repository.summary()