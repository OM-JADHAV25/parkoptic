import pandas as pd

from app.services.normalization_service import (minmax_scale)


class PatrolOptimizerService:
    """
    Patrol Optimizer

    Converts intelligence outputs into
    enforcement deployment recommendations.

    Inputs:
        - TDPI
        - Visibility Gap Index
        - Hotspot Tier

    Outputs:
        - Deployment Score
        - Deployment Rank
        - Recommended Action
    """

    TIER_SCORES = {
        "TIER_1": 100,
        "TIER_2": 75,
        "TIER_3": 50,
        "NORMAL": 0,
    }

    def calculate(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        result = df.copy()


        # Tier Score
        result["tier_score"] = (
            result["hotspot_tier"]
            .map(self.TIER_SCORES)
            .fillna(0)
        )


        # Normalized Components
        result["vgi_component"] = (
            minmax_scale(result["visibility_gap_index"])
        )

        result["tdpi_component"] = (
            minmax_scale(result["tdpi_score"])
        )

        result["tier_component"] = (
            result["tier_score"]
        )


        # Enforcement Priority Score
        result["deployment_score"] = (
            result["vgi_component"] * 0.50
            +
            result["tdpi_component"] * 0.30
            +
            result["tier_component"] * 0.20
        )

        result["deployment_score"] = (
            result["deployment_score"]
            .round(2)
        )


        # Ranking
        result["deployment_rank"] = (
            result["deployment_score"]
            .rank(ascending=False,method="dense")
            .astype(int)
        )


        # Action Recommendation
        result["recommended_action"] = (
            result["visibility_gap_index"]
            .apply(self._recommend_action)
        )

        return result

    @staticmethod
    def _recommend_action(
        visibility_gap: float,
    ) -> str:

        if visibility_gap >= 30:
            return ("Immediate targeted enforcement")

        if visibility_gap >= 20:
            return ("Increase patrol frequency")

        if visibility_gap >= 10:
            return ("Monitor and schedule patrol")

        return "Routine monitoring"