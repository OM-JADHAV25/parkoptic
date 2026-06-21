"""Shared API response schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict


class DatasetSummary(BaseModel):
    dataset: str
    rows: int
    columns: list[str]
    memory_mb: float


class ModelArtifactStatus(BaseModel):
    path: str
    exists: bool
    size_mb: float


class ModelStatusResponse(BaseModel):
    model_config = ConfigDict(extra="allow")


class GenericRecord(BaseModel):
    model_config = ConfigDict(extra="allow")


class PaginatedRecords(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[dict[str, Any]]
