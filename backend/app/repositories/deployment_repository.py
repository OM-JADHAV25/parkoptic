"""
ParkOptic - Deployment Repository

Provides clean, typed access to the deployment impact assessment dataset
loaded in the in-memory DataStore.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from app.core.data_store import data_store


class DeploymentRepository:
    """
    Repository for deployment impact assessment intelligence.

    All data is served from the in-memory DataStore.
    No disk I/O is performed after startup.
    """

    # ------------------------------------------------------------------ #
    # Data Access                                                          #
    # ------------------------------------------------------------------ #

    def dataframe(self) -> pd.DataFrame:
        """Return the full deployment impact DataFrame (read-only view)."""
        return data_store.get("deployment")

    def all(
        self,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Return paginated deployment impact assessment records."""
        return data_store.records("deployment", limit=limit, offset=offset)

    def get_by_h3(self, h3_index: str) -> dict[str, Any] | None:
        """Retrieve a single deployment impact record by H3 index."""
        return data_store.find_by_h3("deployment", h3_index)

    # ------------------------------------------------------------------ #
    # Aggregates                                                           #
    # ------------------------------------------------------------------ #

    def summary(self) -> dict[str, Any]:
        """Return aggregated summary statistics for deployment impact assessments."""
        df = self.dataframe()

        effectiveness_distribution: dict[str, int] = (
            df["deployment_effectiveness"]
            .fillna("UNKNOWN")
            .astype(str)
            .value_counts()
            .to_dict()
            if "deployment_effectiveness" in df.columns
            else {}
        )

        average_projected_tdpi: float = (
            round(float(df["projected_tdpi"].mean()), 2)
            if "projected_tdpi" in df.columns
            else 0.0
        )

        average_improvement: float = (
            round(float(df["operational_improvement_percent"].mean()), 2)
            if "operational_improvement_percent" in df.columns
            else 0.0
        )

        average_roi: float = (
            round(float(df["patrol_roi"].mean()), 2)
            if "patrol_roi" in df.columns
            else 0.0
        )

        return {
            "total_impacts": len(df),
            "average_projected_tdpi": average_projected_tdpi,
            "average_operational_improvement_percent": average_improvement,
            "average_patrol_roi": average_roi,
            "effectiveness_distribution": effectiveness_distribution,
        }

    # ------------------------------------------------------------------ #
    # Metadata                                                             #
    # ------------------------------------------------------------------ #

    def count(self) -> int:
        """Return total number of deployment impact records."""
        return len(self.dataframe())


# Singleton instance
deployment_repository = DeploymentRepository()
