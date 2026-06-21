"""Explainability response schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict


class ArtifactInfo(BaseModel):
    path: str
    exists: bool
    size_mb: float


class ExplainabilityArtifacts(BaseModel):
    artifacts: dict[str, ArtifactInfo]


class HotspotExplainability(BaseModel):
    model_config = ConfigDict(extra="allow")

    h3_index: str
    tdpi: dict[str, Any] | None = None
    forecast: dict[str, Any] | None = None
    visibility_gap: dict[str, Any] | None = None
    deployment: dict[str, Any] | None = None
