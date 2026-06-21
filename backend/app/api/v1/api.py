"""
ParkOptic API v1

Central router for endpoints.
"""

from fastapi import APIRouter

from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.dashboard import router as dashboard_router
from app.api.v1.routes.hotspots import router as hotspots_router
from app.api.v1.routes.forecast import router as forecast_router
from app.api.v1.routes.patrol import router as patrol_router
from app.api.v1.routes.deployment import router as deployment_router
from app.api.v1.routes.validation import router as validation_router
from app.api.v1.routes.explainability import router as explainability_router
from app.api.v1.routes.temporal import router as temporal_router


api_router = APIRouter()

api_router.include_router(
    health_router,
    tags=["System Health"]
)

api_router.include_router(
    dashboard_router,
    prefix="/dashboard",
    tags=["Dashboard"]
)

api_router.include_router(
    hotspots_router,
    prefix="/hotspots",
    tags=["Hotspots"]
)

api_router.include_router(
    forecast_router,
    prefix="/forecast",
    tags=["Forecast"]
)

api_router.include_router(
    patrol_router,
    prefix="/patrol",
    tags=["Patrol"]
)

api_router.include_router(
    deployment_router,
    prefix="/deployment",
    tags=["Deployment"]
)

api_router.include_router(
    validation_router,
    prefix="/validation",
    tags=["Validation"]
)

api_router.include_router(
    explainability_router,
    prefix="/explainability",
    tags=["Explainability"]
)

api_router.include_router(
    temporal_router,
    prefix="/temporal",
    tags=["Temporal Intelligence"]
)