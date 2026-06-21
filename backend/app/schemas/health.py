"""
Health Response Schema.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class HealthResponse(BaseModel):

    status: str
    application: str
    datasets_loaded: bool
    datasets: dict[str, Any]