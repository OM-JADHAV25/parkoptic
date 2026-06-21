"""
ParkOptic - Validation Repository

Provides clean, typed access to the violation validation predictions dataset
loaded in the in-memory DataStore.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from app.core.data_store import data_store


class ValidationRepository:
    """
    Repository for violation validation classifier predictions.

    All data is served from the in-memory DataStore.
    No disk I/O is performed after startup.
    """

    # ------------------------------------------------------------------ #
    # Data Access                                                          #
    # ------------------------------------------------------------------ #

    def dataframe(self) -> pd.DataFrame:
        """Return the full validation predictions DataFrame (read-only view)."""
        return data_store.get("validation")

    def all(
        self,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Return paginated validation prediction records."""
        return data_store.records("validation", limit=limit, offset=offset)

    # ------------------------------------------------------------------ #
    # Aggregates                                                           #
    # ------------------------------------------------------------------ #

    def stats(self) -> dict[str, Any]:
        """Return aggregated statistics from the validation classifier output."""
        df = self.dataframe()

        actual_distribution: dict[str, int] = (
            df["actual"].fillna("UNKNOWN").astype(str).value_counts().to_dict()
            if "actual" in df.columns
            else {}
        )

        prediction_distribution: dict[str, int] = (
            df["prediction"].fillna("UNKNOWN").astype(str).value_counts().to_dict()
            if "prediction" in df.columns
            else {}
        )

        average_approval_probability: float = (
            round(float(df["approval_probability"].mean()), 4)
            if "approval_probability" in df.columns
            else 0.0
        )

        accuracy: float = 0.0
        if "actual" in df.columns and "prediction" in df.columns:
            correct = (df["actual"] == df["prediction"]).sum()
            total = len(df)
            if total > 0:
                accuracy = round(float(correct / total * 100), 2)

        return {
            "total_predictions": len(df),
            "actual_distribution": actual_distribution,
            "prediction_distribution": prediction_distribution,
            "average_approval_probability": average_approval_probability,
            "accuracy": accuracy,
            "model_artifacts": data_store.model_status(),
        }

    # ------------------------------------------------------------------ #
    # Metadata                                                             #
    # ------------------------------------------------------------------ #

    def count(self) -> int:
        """Return total number of validation prediction records."""
        return len(self.dataframe())


# Singleton instance
validation_repository = ValidationRepository()
