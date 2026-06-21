"""Patrol recommendation response schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class PatrolRecommendation(BaseModel):
    model_config = ConfigDict(extra="allow")


class PatrolSummary(BaseModel):
    total_recommendations: int
    priority_distribution: dict[str, int]
    total_recommended_units: int
    average_deployment_score: float
