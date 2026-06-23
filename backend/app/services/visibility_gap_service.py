import pandas as pd

from app.services.normalization_service import (
    minmax_scale,
)


class VisibilityGapService:
    """
    Visibility Gap Index (VGI)

    Measures the gap between:
        - Traffic disruption potential (TDPI)
        - Enforcement visibility / coverage

    Higher VGI means:
        High disruption + Low visibility

    Which indicates zones that should be prioritized
    for targeted enforcement.
    """

    def calculate(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        result = df.copy()

        # Coverage Components
        result["device_coverage_score"] = (
            minmax_scale(result["unique_devices"])
        )

        result["patrol_frequency_score"] = (
            minmax_scale( result["active_days"])
        )

        # removed -> result["confidence_coverage_score"] = (result["approval_rate"] * 100)


        # Coverage Score
        result["coverage_score"] = (
            result["device_coverage_score"] * 0.60
            +
            result["patrol_frequency_score"] * 0.40
        )

        result["coverage_score"] = (
            result["coverage_score"]
            .clip(0, 100)
            .round(2)
        )


        # Visibility Gap Index
        result["visibility_gap_index"] = (
            result["tdpi_score"] * (1 - (result["coverage_score"] / 100))
        )

        result["visibility_gap_index"] = (
            result["visibility_gap_index"]
            .round(2)
        )

        # Percentile Ranking
        result["vgi_percentile"] = (
            result["visibility_gap_index"]
            .rank(pct=True)
            * 100
        ).round(2)


        # Patrol Priority Ranking
        result["recommended_priority"] = (
            result["visibility_gap_index"]
            .rank(ascending=False,method="dense",)
            .astype(int)
        )

        # Gap Category
        result["gap_category"] = (
            result["visibility_gap_index"]
            .apply(self._categorize_gap)
        )

        return result

    @staticmethod
    def _categorize_gap(
        score: float,
    ) -> str:

        if score >= 30:
            return "CRITICAL_GAP"

        if score >= 25:
            return "HIGH_GAP"

        if score >= 15:
            return "MEDIUM_GAP"

        if score >= 5:
            return "LOW_GAP"

        return "MINIMAL_GAP"