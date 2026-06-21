"""Violation validation API routes."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.core.data_store import data_store
from app.core.settings import settings
from app.repositories.validation_repository import validation_repository
from app.schemas.validation import ValidationPrediction, ValidationStats


router = APIRouter()


@router.get(
    "/predictions",
    response_model=list[ValidationPrediction],
    summary="Validation Predictions",
)
async def get_validation_predictions(
    limit: int = Query(default=100, ge=1, le=settings.MAX_PAGE_SIZE),
    offset: int = Query(default=0, ge=0),
):
    return validation_repository.all(limit=limit, offset=offset)


@router.get(
    "/stats",
    response_model=ValidationStats,
    summary="Validation Model Statistics",
)
async def validation_stats():
    return validation_repository.stats()


@router.get(
    "/models",
    summary="Validation And Forecast Model Artifact Status",
)
async def validation_model_status():
    # Model artifact status is a DataStore-level concern — not a dataset concern.
    # The DataStore keeps a reference to all trained model files on disk.
    return data_store.model_status()
