"""
ParkOptic Dashboard Response Schemas.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict



# Overview
class DashboardOverview(BaseModel):
    total_hotspots: int
    average_tdpi: float
    average_forecast: float
    average_deployment_score: float
    immediate_deployments: int
    average_visibility_gap: float


# Top Hotspot
class TopHotspot(BaseModel):
    model_config = ConfigDict(extra="allow")


# Dashboard Response
class DashboardResponse(BaseModel):

    overview: DashboardOverview

    tier_distribution: dict[str, int]

    risk_distribution: dict[str, int]

    top_hotspots: list[TopHotspot]

    system: dict[str, Any]