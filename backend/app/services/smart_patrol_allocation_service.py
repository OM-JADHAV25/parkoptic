"""
ParkOptic - Smart Patrol Allocation Service

Purpose
-------
Transforms the complete intelligence layer into actionablepatrol deployment recommendations.

Inputs
------
- TDPI
- Visibility Gap Index
- Forecasting Output
- Spatial Criticality

Outputs
-------
- Deployment Score
- Patrol Priority
- Recommended Patrol Units
- Coverage Estimation
- Expected Risk Reduction
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.services.normalization_service import minmax_scale


class SmartPatrolAllocationService:
    """
    Production-grade patrol allocation engine.

    Combines:

    • Current hotspot severity
    • Future hotspot escalation
    • Visibility gap
    • Spatial criticality

    into one operational deployment decision.
    """

    # Configuration
    TDPI_WEIGHT = 0.30
    FORECAST_WEIGHT = 0.25
    VGI_WEIGHT = 0.25
    SPATIAL_WEIGHT = 0.10
    TIER_WEIGHT = 0.10
    TIER_SCORES = {
        "TIER_1": 100,
        "TIER_2": 75,
        "TIER_3": 50,
        "NORMAL": 0,
    }

    REQUIRED_COLUMNS = [
        "tdpi_score",
        "visibility_gap_index",
        "hotspot_tier",
        "junctions",
        "police_stations",
        "predicted_violations",
        "approved_violations",
        "total_violations"
    ]


    # Validation
    def _validate(
        self,
        df: pd.DataFrame,
    ):

        missing = [
            column
            for column in self.REQUIRED_COLUMNS

            if column not in df.columns
        ]

        if missing:

            raise ValueError( f"Missing columns: {missing}")


    # Tier
    def _compute_tier_score(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        df["tier_score"] = (
            df["hotspot_tier"]
            .map(self.TIER_SCORES)
            .fillna(0)
        )

        return df


    # Spatial Criticality
    def _compute_spatial_criticality(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        raw_score = (0.60 * df["junctions"] + 0.40 * df["police_stations"])

        df["spatial_criticality"] = (minmax_scale(raw_score))

        return df


    # Forecast Pressure
    def _compute_forecast_pressure(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        df["forecast_pressure"] = (
            minmax_scale( df["predicted_violations"])
        )

        return df


    # Component Normalization
    def _normalize_components(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        df["tdpi_component"] = (
            minmax_scale(df["tdpi_score"])
        )

        df["vgi_component"] = (
            minmax_scale(df["visibility_gap_index"])
        )

        df["tier_component"] = (df["tier_score"])

        return df
    

  
    # Deployment Score
    def _compute_deployment_score(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        df["deployment_score"] = (
            df["tdpi_component"] * self.TDPI_WEIGHT
            +
            df["forecast_pressure"] * self.FORECAST_WEIGHT
            +
            df["vgi_component"] * self.VGI_WEIGHT
            +
            df["spatial_criticality"] * self.SPATIAL_WEIGHT
            +
            df["tier_component"] * self.TIER_WEIGHT
        )

        df["deployment_score"] = (
            df["deployment_score"]
            .round(2)
        )

        return df


    # Patrol Unit Recommendation
    def _recommend_patrol_units(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        conditions = [
            df["deployment_score"] >= 75,
            df["deployment_score"] >= 50,
            df["deployment_score"] >= 25,
        ]

        choices = [4,3,2]

        df["recommended_patrol_units"] = np.select(conditions,choices,default=1)

        return df


    # Deployment Priority
    def _assign_priority(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        conditions = [
            df["deployment_score"] >= 75,
            df["deployment_score"] >= 50,
            df["deployment_score"] >= 25,
        ]

        choices = ["IMMEDIATE", "HIGH", "MEDIUM"]

        df["deployment_priority"] = np.select(conditions, choices, default="ROUTINE")

        return df

  
    # Expected Enforcement Coverage
    def _compute_historical_enforcement_rate(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        coverage = (df["approved_violations"] / df["total_violations"]) * 100

        coverage = coverage.fillna(0)

        coverage = coverage.clip(upper=100)

        df["historical_enforcement_rate"] = (coverage.round(2))

        return df

    # Estimated TDPI Reduction

    def _estimate_tdpi_reduction(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        df["estimated_tdpi_reduction"] = (
            df["tdpi_score"]
            *
            (df["historical_enforcement_rate"]/ 100)
        ).round(2)

        return df

    # Estimated Operational Risk Reduction
    def _estimate_operational_reduction(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        reduction = (df["estimated_tdpi_reduction"]/df["tdpi_score"]) * 100

        reduction = (reduction.replace([np.inf,-np.inf],0,).fillna(0))

        df["estimated_operational_risk_reduction"] = (reduction.round(2))

        return df


    # Recommendation Reason
    def _generate_reason(
        self,
        row: pd.Series,
    ) -> str:

        reasons = []

        # Severity
        if row["tdpi_score"] >= 75:
            reasons.append("high hotspot severity")
        elif row["tdpi_score"] >= 50:
            reasons.append("moderate hotspot severity")

        # Visibility
        if row["visibility_gap_index"] >= 30:
            reasons.append("low enforcement visibility")
        elif row["visibility_gap_index"] >= 20:
            reasons.append("limited patrol coverage")

        # Forecast
        if row["forecast_pressure"] >= 75:
            reasons.append("rapid forecast escalation")
        elif row["forecast_pressure"] >= 50:
            reasons.append("increasing parking demand")

        # Spatial
        if row["spatial_criticality"] >= 75:
            reasons.append("critical road junction")

        if not reasons:
            return ("Stable hotspot requiring routine monitoring.")

        sentence = ", ".join(reasons)

        return sentence.capitalize() + "."


    # Recommendation Text
    def _generate_recommendations(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        df["recommendation_reason"] = (
            df.apply(
                self._generate_reason,
                axis=1,
            )
        )

        df["recommended_action"] = (
            df.apply(
                self._generate_action,
                axis=1
            )
        )

        return df
    


    # Deployment Ranking
    def _rank_deployments(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        df = df.sort_values(
            "deployment_score",
            ascending=False,
        ).reset_index(drop=True)

        df["deployment_rank"] = (
            df["deployment_score"]
            .rank(ascending=False, method="dense",)
            .astype(int)
        )

        return df
    



    def _generate_action(
        self,
        row: pd.Series,
    ) -> str:

        units = row["recommended_patrol_units"]

        priority = row["deployment_priority"]

        if priority == "IMMEDIATE":
            return (f"Deploy {units} patrol units within 24 hours.")

        if priority == "HIGH":
            return (f"Deploy {units} patrol units during peak hours.")

        if priority == "MEDIUM":
            return (f"Schedule {units} patrol units this week.")

        return ("Routine monitoring is sufficient.")


    # Final Output
    def _select_output_columns(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        columns = [

            # Identity
            "h3_index",
            "latitude",
            "longitude",

            # Existing Intelligence
            "tdpi_score",
            "visibility_gap_index",
            "hotspot_tier",

            # Forecast
            "predicted_violations",
            "forecast_pressure",

            # Spatial
            "junctions",
            "police_stations",
            "spatial_criticality",

            # Patrol Decision
            "deployment_score",
            "deployment_rank",
            "deployment_priority",

            # Recommendation
            "recommended_patrol_units",
            "historical_enforcement_rate",
            "estimated_tdpi_reduction",
            "estimated_operational_risk_reduction",

            "recommendation_reason",
            "approved_violations",
            "total_violations"
        ]

        existing = [
            column
            for column in columns

            if column in df.columns
        ]

        return df[
            existing
        ].copy()


    # Updated Public Pipeline
    def calculate(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        self._validate(df)

        result = df.copy()

        result = self._compute_tier_score(result)

        result = self._compute_spatial_criticality(result)

        result = self._compute_forecast_pressure(result)

        result = self._normalize_components(result)

        result = self._compute_deployment_score(result)

        result = self._recommend_patrol_units(result)

        result = self._assign_priority(result)

        result = self._compute_historical_enforcement_rate(result)

        result = self._estimate_tdpi_reduction(result)

        result = self._estimate_operational_reduction(result)

        result = self._generate_recommendations(result)

        result = self._rank_deployments(result)

        result = self._select_output_columns(result)

        return result