"""
ParkOptic - Patrol Simulation Schemas

Request and response schemas for the patrol simulation endpoint.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PatrolSimulationRequest(BaseModel):
    """
    Request body for POST /api/v1/patrol/simulate.

    ``allocations`` maps each H3 cell index to the desired number of
    patrol units the user wants to assign during the simulation.
    Cells not listed here retain their baseline recommendation.
    """

    allocations: dict[str, int] = Field(
        ...,
        description="Mapping of H3 index → custom patrol unit count.",
        min_length=1,
    )


class SimulationComparisonSummary(BaseModel):
    """High-level comparison metrics between baseline and simulated deployments."""

    cells_overridden: int
    baseline_avg_projected_tdpi: float
    simulated_avg_projected_tdpi: float
    projected_tdpi_delta: float
    baseline_avg_improvement_percent: float
    simulated_avg_improvement_percent: float
    baseline_avg_patrol_roi: float
    simulated_avg_patrol_roi: float
    baseline_avg_violations_addressed: float
    simulated_avg_violations_addressed: float


class PatrolSimulationResponse(BaseModel):
    """Full response payload from the patrol simulation endpoint."""

    model_config = ConfigDict(extra="allow")

    baseline: list[dict[str, Any]]
    simulated: list[dict[str, Any]]
    summary: SimulationComparisonSummary
