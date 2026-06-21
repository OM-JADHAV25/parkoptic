"""Forecast response schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict


class ForecastRecord(BaseModel):
    model_config = ConfigDict(extra="allow")


class ForecastSummary(BaseModel):
    total_predictions: int
    average_predicted_violations: float
    max_predicted_violations: float
    trend_distribution: dict[str, int]
    model_artifacts: dict[str, Any]
