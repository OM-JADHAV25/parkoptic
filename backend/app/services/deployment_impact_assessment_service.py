"""
ParkOptic - Deployment Impact Assessment Service

Purpose
-------
Estimate the expected operational impact of executingthe recommended patrol deployment plan.
This module does NOT predict reality.
Instead, it converts explainable intelligence outputs into
estimated operational outcomes that help traffic police
prioritize enforcement actions.

Inputs
------
- Patrol Allocation Output
- Forecast Violations
- TDPI
- Historical Enforcement Effectiveness

Outputs
-------
- Estimated Weekly Violations Addressed
- Projected TDPI
- Estimated Remaining Risk
"""

from __future__ import annotations

import numpy as np
import pandas as pd


class DeploymentImpactAssessmentService:
    """
    Deployment Impact Assessment Engine.

    Converts patrol recommendations into estimated
    operational improvements.
    """

    REQUIRED_COLUMNS = [
        "deployment_score",
        "recommended_patrol_units",
        "predicted_violations",
        "tdpi_score",
        "approved_violations",
        "total_violations",

    ]

    PATROL_CAPACITY_PER_UNIT = 12
    MAX_EFFECTIVENESS = 0.90


    # Public API
    def calculate(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        self._validate(df)

        result = df.copy()

        result = self._compute_enforcement_effectiveness(result)

        result = self._estimate_weekly_violations_addressed(result)

        result = self._project_tdpi(result)

        return result

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
        


     # Historical Enforcement Effectiveness
    def _compute_enforcement_effectiveness(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        effectiveness = (df["approved_violations"]/df["total_violations"])

        effectiveness = (
            effectiveness
            .replace([np.inf,-np.inf],0,)
            .fillna(0)
        )

        effectiveness = effectiveness.clip(upper=self.MAX_EFFECTIVENESS)

        df["estimated_enforcement_effectiveness"] = (effectiveness.round(3))

        return df

    # Weekly Violations Addressed
    def _estimate_weekly_violations_addressed(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        patrol_capacity = (df["recommended_patrol_units"] * self.PATROL_CAPACITY_PER_UNIT)

        expected = (df["predicted_violations"] * df["estimated_enforcement_effectiveness"])

        addressed = np.minimum(patrol_capacity,expected)

        df["estimated_weekly_violations_addressed"] = (addressed.round(2))

        return df



    # Projected TDPI
    def _project_tdpi(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        projected = (df["tdpi_score"]*(1-df["estimated_enforcement_effectiveness"]))

        projected = projected.clip(lower=0)

        df["projected_tdpi"] = (projected.round(2))

        return df
    


    # Operational Improvement
    def _compute_operational_improvement(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        improvement = ((df["tdpi_score"] - df["projected_tdpi"])/df["tdpi_score"]) * 100

        improvement = (
        improvement
            .replace([np.inf,-np.inf,],0,)
            .fillna(0)
            .clip(lower=0,upper=100,)
        )

        df["operational_improvement_percent"] = (improvement.round(2))

        return df

    
    # Patrol ROI
    def _compute_patrol_roi(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        roi = (df["estimated_weekly_violations_addressed"]/df["recommended_patrol_units"])

        roi = (roi.replace([np.inf,-np.inf],0).fillna(0))

        df["patrol_roi"] = (roi.round(2))

        return df


    # Remaining Risk
    def _assign_remaining_risk(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        conditions = [
            df["projected_tdpi"] >= 75,
            df["projected_tdpi"] >= 50,
            df["projected_tdpi"] >= 25,
        ]

        choices = ["CRITICAL","HIGH", "MODERATE"]

        df["estimated_remaining_risk"] = np.select(conditions,choices,default="LOW")

        return df


    # Deployment Effectiveness
    def _deployment_effectiveness(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        conditions = [
            df["operational_improvement_percent"] >= 50,
            df["operational_improvement_percent"] >= 30,
            df["operational_improvement_percent"] >= 15,
        ]

        choices = ["EXCELLENT","HIGH","MODERATE",]

        df["deployment_effectiveness"] = np.select(conditions,choices,default="LOW",)

        return df


    # Decision Confidence
    def _compute_confidence(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        confidence = ((df["estimated_enforcement_effectiveness"] * 100) + (df["deployment_score"] * 0.50))

        confidence = confidence.clip(upper=100)

        df["decision_confidence"] = (confidence.round(2))

        return df

    
    # Executive Summary
    def _build_summary(
        self,
        row: pd.Series,
    ) -> str:

        return (

            f"Deploy "
            f"{row['recommended_patrol_units']} patrol unit(s). "
            f"Estimated to address "
            f"{row['estimated_weekly_violations_addressed']:.0f} "
            f"violations next week, "
            f"reducing operational pressure by "
            f"{row['operational_improvement_percent']:.1f}% "
            f"while leaving "
            f"{row['estimated_remaining_risk'].lower()} "
            f"remaining risk."

        )


    # Generate Executive Summary
    def _generate_summary(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        df["executive_summary"] = (
            df.apply(
                self._build_summary,
                axis=1,
            )
        )

        return df
    

    # Final Output Selection
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
            "deployment_score",
            "deployment_rank",
            "deployment_priority",

            "recommended_patrol_units",

            "tdpi_score",
            "predicted_violations",

            # Impact Assessment
            "estimated_enforcement_effectiveness",
            "estimated_weekly_violations_addressed",
            "projected_tdpi",
            "operational_improvement_percent",


            "impact_rank",
            "deployment_effectiveness",
            "patrol_roi",
            "estimated_remaining_risk",
            "decision_confidence",
            "executive_summary",
        ]

        existing_columns = [
            column

            for column in columns
            if column in df.columns

        ]

        return df[
            existing_columns
        ].copy()


    # Ranking

    def _rank_impact(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        df = df.sort_values(
            by=["operational_improvement_percent","deployment_score",],
            ascending=False,
        ).reset_index(drop=True,)

        df["impact_rank"] = (range(1,len(df) + 1))

        return df


    # Final Public API
    def calculate(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        self._validate(df)

        result = df.copy()

        result = self._compute_enforcement_effectiveness(result)

        result = self._estimate_weekly_violations_addressed(result)

        result = self._project_tdpi(result)

        result = self._compute_operational_improvement(result)

        result = self._compute_patrol_roi(result)

        result = self._assign_remaining_risk(result)

        result = self._deployment_effectiveness(result)

        result = self._compute_confidence(result)

        result = self._generate_summary(result)

        result = self._rank_impact(result)

        result = self._select_output_columns(result)

        return result