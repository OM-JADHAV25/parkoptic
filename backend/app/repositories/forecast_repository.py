"""
ParkOptic - Forecast Repository

Provides clean, typed access to the forecast predictions dataset
loaded in the in-memory DataStore.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from app.core.data_store import data_store


class ForecastRepository:
    """
    Repository for hotspot forecasting intelligence.

    All data is served from the in-memory DataStore.
    No disk I/O is performed after startup.
    """

    # ------------------------------------------------------------------ #
    # Data Access                                                          #
    # ------------------------------------------------------------------ #

    def dataframe(self) -> pd.DataFrame:
        """Return the full forecast predictions DataFrame (read-only view)."""
        return data_store.get("forecast")

    def all(
        self,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Return paginated forecast prediction records."""
        return data_store.records("forecast", limit=limit, offset=offset)

    def get_by_h3(self, h3_index: str) -> list[dict[str, Any]]:
        """
        Return all forecast rows for a given H3 index.

        The forecast dataset may contain multiple weekly rows per cell.
        Returns an empty list if none found.
        """
        df = self.dataframe()

        if "h3_index" not in df.columns:
            return []

        result = df.loc[df["h3_index"] == h3_index]
        return data_store._records(result)

    # ------------------------------------------------------------------ #
    # Aggregates                                                           #
    # ------------------------------------------------------------------ #

    def summary(self) -> dict[str, Any]:
        """Return aggregated summary statistics for forecast predictions."""
        df = self.dataframe()

        predicted = (
            df["predicted_violations"]
            if "predicted_violations" in df.columns
            else None
        )

        trend_distribution: dict[str, int] = (
            df["trend"].fillna("UNKNOWN").astype(str).value_counts().to_dict()
            if "trend" in df.columns
            else {}
        )

        return {
            "total_predictions": len(df),
            "average_predicted_violations": (
                round(float(predicted.mean()), 2) if predicted is not None else 0.0
            ),
            "max_predicted_violations": (
                round(float(predicted.max()), 2) if predicted is not None else 0.0
            ),
            "trend_distribution": trend_distribution,
            "model_artifacts": data_store.model_status(),
        }

    # ------------------------------------------------------------------ #
    # Metadata                                                             #
    # ------------------------------------------------------------------ #

    def count(self) -> int:
        """Return total number of forecast records."""
        return len(self.dataframe())


# Singleton instance
forecast_repository = ForecastRepository()
