"""Validation model response schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict


class ValidationPrediction(BaseModel):
    model_config = ConfigDict(extra="allow")


class ValidationStats(BaseModel):
    total_predictions: int
    actual_distribution: dict[str, int]
    prediction_distribution: dict[str, int]
    average_approval_probability: float
    accuracy: float
    model_artifacts: dict[str, Any]
