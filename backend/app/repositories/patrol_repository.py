"""
ParkOptic - Patrol Repository

Provides clean, typed access to the patrol recommendation dataset
loaded in the in-memory DataStore.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from app.core.data_store import data_store


class PatrolRepository:
    """
    Repository for patrol recommendation intelligence.

    All data is served from the in-memory DataStore.
    No disk I/O is performed after startup.
    """

    # ------------------------------------------------------------------ #
    # Data Access                                                          #
    # ------------------------------------------------------------------ #

    def dataframe(self) -> pd.DataFrame:
        """Return the full patrol recommendations DataFrame (read-only view)."""
        return data_store.get("patrol")

    def all(
        self,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Return paginated patrol recommendation records."""
        return data_store.records("patrol", limit=limit, offset=offset)

    def get_by_h3(self, h3_index: str) -> dict[str, Any] | None:
        """Retrieve a single patrol recommendation by H3 index."""
        return data_store.find_by_h3("patrol", h3_index)

    # ------------------------------------------------------------------ #
    # Filtering                                                            #
    # ------------------------------------------------------------------ #

    def filter_by_priority(
        self,
        priority: str,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Return records filtered by deployment priority."""
        df = self.dataframe()

        if "deployment_priority" in df.columns:
            df = df.loc[df["deployment_priority"] == priority]

        if limit is not None:
            df = df.iloc[offset : offset + limit]
        elif offset:
            df = df.iloc[offset:]

        return data_store._records(df)

    # ------------------------------------------------------------------ #
    # Sorting                                                              #
    # ------------------------------------------------------------------ #

    def top(self, limit: int = 10) -> list[dict[str, Any]]:
        """Return the top N highest-priority recommendations."""
        df = self.dataframe()

        if "deployment_rank" in df.columns:
            df = df.sort_values("deployment_rank", ascending=True)
        elif "deployment_score" in df.columns:
            df = df.sort_values("deployment_score", ascending=False)

        return data_store._records(df.head(limit))

    # ------------------------------------------------------------------ #
    # Aggregates                                                           #
    # ------------------------------------------------------------------ #

    def summary(self) -> dict[str, Any]:
        """Return aggregated summary statistics for patrol recommendations."""
        df = self.dataframe()

        priority_distribution: dict[str, int] = (
            df["deployment_priority"]
            .fillna("UNKNOWN")
            .astype(str)
            .value_counts()
            .to_dict()
            if "deployment_priority" in df.columns
            else {}
        )

        total_units: int = (
            int(df["recommended_patrol_units"].sum())
            if "recommended_patrol_units" in df.columns
            else 0
        )

        average_score: float = (
            round(float(df["deployment_score"].mean()), 2)
            if "deployment_score" in df.columns
            else 0.0
        )

        return {
            "total_recommendations": len(df),
            "priority_distribution": priority_distribution,
            "total_recommended_units": total_units,
            "average_deployment_score": average_score,
        }

    # ------------------------------------------------------------------ #
    # Metadata                                                             #
    # ------------------------------------------------------------------ #

    def count(self) -> int:
        """Return total number of patrol recommendation records."""
        return len(self.dataframe())


# Singleton instance
patrol_repository = PatrolRepository()
