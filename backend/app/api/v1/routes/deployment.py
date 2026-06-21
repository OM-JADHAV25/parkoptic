"""Deployment impact API routes."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.core.settings import settings
from app.repositories.deployment_repository import deployment_repository
from app.schemas.deployment import DeploymentImpactRecord, DeploymentSummary


router = APIRouter()


@router.get(
    "/impact",
    response_model=list[DeploymentImpactRecord],
    summary="Deployment Impact Assessments",
)
async def get_deployment_impacts(
    limit: int = Query(default=100, ge=1, le=settings.MAX_PAGE_SIZE),
    offset: int = Query(default=0, ge=0),
):
    return deployment_repository.all(limit=limit, offset=offset)


@router.get(
    "/summary",
    response_model=DeploymentSummary,
    summary="Deployment Impact Summary",
)
async def deployment_summary():
    return deployment_repository.summary()


@router.get(
    "/{h3_index}",
    response_model=DeploymentImpactRecord,
    summary="Deployment Impact For H3 Cell",
)
async def get_deployment_by_h3(h3_index: str):
    impact = deployment_repository.get_by_h3(h3_index)

    if impact is None:
        raise HTTPException(status_code=404, detail="Deployment impact not found.")

    return impact
