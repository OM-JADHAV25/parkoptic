"""
Hotspot Schemas.
"""

from typing import Any

from pydantic import BaseModel, ConfigDict


class MapHotspot(BaseModel):
    h3_index: str
    latitude: float
    longitude: float
    tdpi_score: float | None = None
    tdpi_percentile: float | None = None
    hotspot_tier: str | None = None
    risk_category: str | None = None
    visibility_gap_index: float | None = None
    deployment_priority: str | None = None
    deployment_score: float | None = None
    
    # Temporal Intelligence Enrichment
    temporal_weight: float | None = None
    hourly_estimate: float | None = None
    operational_risk: float | None = None
    peak_hour: int | None = None


class HotspotDetails(BaseModel):

    h3_index: str
    latitude: float
    longitude: float
    tdpi: dict[str, Any] | None = None
    forecast: dict[str, Any] | None = None
    visibility_gap: dict[str, Any] | None = None
    deployment: dict[str, Any] | None = None
    validation: dict[str, Any] | None = None
    model_config = ConfigDict(extra="allow")