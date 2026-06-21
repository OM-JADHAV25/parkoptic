"""Patrol recommendation API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.core.settings import settings
from app.repositories.patrol_repository import patrol_repository
from app.schemas.patrol import PatrolRecommendation, PatrolSummary
from app.schemas.simulation import PatrolSimulationRequest, PatrolSimulationResponse
from app.services.patrol_simulation_service import patrol_simulation_service


router = APIRouter()


@router.get(
    "/recommendations",
    response_model=list[PatrolRecommendation],
    summary="Patrol Recommendations",
)
async def get_patrol_recommendations(
    priority: str | None = None,
    limit: int = Query(default=100, ge=1, le=settings.MAX_PAGE_SIZE),
    offset: int = Query(default=0, ge=0),
):
    if priority:
        return patrol_repository.filter_by_priority(
            priority=priority, limit=limit, offset=offset
        )
    return patrol_repository.all(limit=limit, offset=offset)


@router.get(
    "/summary",
    response_model=PatrolSummary,
    summary="Patrol Recommendation Summary",
)
async def patrol_summary():
    return patrol_repository.summary()


@router.get(
    "/top",
    response_model=list[PatrolRecommendation],
    summary="Top Patrol Recommendations",
)
async def top_patrol_recommendations(
    limit: int = Query(default=10, ge=1, le=100),
):
    return patrol_repository.top(limit=limit)


@router.post(
    "/simulate",
    response_model=PatrolSimulationResponse,
    summary="Patrol Allocation Simulation",
    description=(
        "Run a what-if patrol allocation scenario. "
        "Provide a mapping of H3 index → patrol unit count. "
        "Returns baseline and simulated deployment impact projections."
    ),
)
async def simulate_patrol_allocation(
    body: PatrolSimulationRequest,
    hour: int | None = Query(default=None, ge=0, le=23, description="Optional hour for temporal scaling"),
):
    try:
        result = patrol_simulation_service.simulate(body.allocations, hour=hour)
        return result
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Simulation failed: {exc}")


@router.get(
    "/{h3_index}",
    response_model=PatrolRecommendation,
    summary="Patrol Recommendation For H3 Cell",
)
async def get_patrol_by_h3(h3_index: str):
    recommendation = patrol_repository.get_by_h3(h3_index)

    if recommendation is None:
        raise HTTPException(status_code=404, detail="Patrol recommendation not found.")

    return recommendation
