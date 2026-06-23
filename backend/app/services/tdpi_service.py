import pandas as pd

from app.services.normalization_service import (
    log_scale,
    minmax_scale,
    safe_divide,
)


class TDPIService:
    """
    Traffic Disruption Potential Index (TDPI)

    Composite index measuring parking-induced traffic disruption.

    Components:

    35% Density
    25% Persistence
    15% Enforcement Confidence
    15% Repeat Offender Pressure
    10% Spatial Complexity
    """

    STUDY_DURATION_DAYS = 151

    def calculate(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        result = df.copy()

        # Density Score
        result["density_score"] = log_scale(
            result["violations_per_day"]
        )

        # Persistence Score
        result["persistence_score"] = (
            result["active_days"]
            /
            self.STUDY_DURATION_DAYS
        ) * 100

        result["persistence_score"] = (
            result["persistence_score"]
            .clip(0, 100)
        )


        # Confidence Score
        result["historical_enforcement_score"] = (
            result["approval_rate"]
            * 100
        )


        # Repeat Offender Pressure
        repeat_ratio = safe_divide(
            result["repeat_offenders"],
            result["unique_vehicles"],
        )

        result["repeat_pressure_score"] = (
            repeat_ratio * 100
        )

        result["repeat_pressure_score"] = (
            result["repeat_pressure_score"]
            .clip(0, 100)
        )


        # Spatial Complexity
        # Normalize each component independently before combining them.
        junction_score = minmax_scale(result["junctions"])
        police_station_score = minmax_scale(result["police_stations"])

        result["spatial_complexity_score"] = (
            junction_score * 0.70
            +
            police_station_score * 0.30
        )

        result["spatial_complexity_score"] = (
            result["spatial_complexity_score"].clip(0, 100)
        )


        # TDPI
        result["tdpi_score"] = (
            result["density_score"] * 0.35
            +
            result["persistence_score"] * 0.25
            +
            result["historical_enforcement_score"] * 0.15
            +
            result["repeat_pressure_score"] * 0.15
            +
            result["spatial_complexity_score"] * 0.10
        )

        result["tdpi_score"] = (
            result["tdpi_score"]
            .round(2)
        )

        # Percentile Ranking
        result["tdpi_percentile"] = (
            result["tdpi_score"]
            .rank(pct=True )
            * 100
        ).round(2)

        # Hotspot Tiers
        result["hotspot_tier"] = (
            result["tdpi_percentile"]
            .apply(self._assign_hotspot_tier)
        )

        # Risk Category
        result["risk_category"] = (
            result["tdpi_score"]
            .apply( self._categorize_risk)
        )

        return result

    @staticmethod
    def _categorize_risk(
        score: float,
    ) -> str:

        if score >= 75:
            return "CRITICAL"

        if score >= 60:
            return "HIGH"

        if score >= 40:
            return "MEDIUM"

        if score >= 20:
            return "LOW"

        return "MINIMAL"
    
    @staticmethod
    def _assign_hotspot_tier(
        percentile: float,
    ) -> str:
        
        if percentile >= 99:
            return "TIER_1"
        
        if percentile >= 95:
            return "TIER_2"
        
        if percentile >= 90:
            return "TIER_3"
        
        return "NORMAL"