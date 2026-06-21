"""Deployment impact response schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class DeploymentImpactRecord(BaseModel):
    model_config = ConfigDict(extra="allow")


class DeploymentSummary(BaseModel):
    total_impacts: int
    average_projected_tdpi: float
    average_operational_improvement_percent: float
    average_patrol_roi: float
    effectiveness_distribution: dict[str, int]
