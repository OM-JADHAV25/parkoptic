"""
ParkOptic - Patrol Simulation Service

Purpose
-------
Orchestrates "what-if" patrol allocation scenarios by applying
user-specified overrides to a temporary in-memory copy of the
patrol recommendations dataset, then delegating all impact
calculations to the existing DeploymentImpactAssessmentService.

Architecture
------------
Router
  └─> PatrolSimulationService          (this file — orchestration only)
        ├─> PatrolRepository           (read baseline dataset)
        └─> DeploymentImpactAssessmentService  (existing business logic)

This service intentionally contains NO calculation algorithms.
All mathematics remain in DeploymentImpactAssessmentService.

No persistent datasets, Parquet files, or model artifacts are
modified at any point during simulation.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.repositories.patrol_repository import patrol_repository
from app.services.deployment_impact_assessment_service import (
    DeploymentImpactAssessmentService,
)
from utils.logger import LOG


class PatrolSimulationService:
    """
    Lightweight orchestration service for patrol allocation simulation.

    Accepts a mapping of H3 index → custom patrol unit count,
    applies those overrides to a temporary DataFrame copy, and
    returns recalculated deployment impact projections using the
    existing DeploymentImpactAssessmentService.

    The baseline dataset is never modified.
    """

    def __init__(self) -> None:
        self._impact_service = DeploymentImpactAssessmentService()

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def simulate(
        self,
        allocations: dict[str, int],
        hour: int | None = None,
    ) -> dict[str, Any]:
        """
        Run a patrol allocation simulation.

        Parameters
        ----------
        allocations : dict[str, int]
            Mapping of H3 index → custom patrol unit count.
            Only cells present in this dict are overridden.
            All other cells retain their baseline values.

        Returns
        -------
        dict with keys:
            baseline  – list of impact records using baseline allocations
            simulated – list of impact records using overridden allocations
            summary   – aggregate comparison between baseline and simulated
        """

        LOG.info(
            f"PatrolSimulationService.simulate: "
            f"{len(allocations)} cell override(s) requested."
        )

        # Obtain the baseline patrol DataFrame.
        baseline_df = patrol_repository.dataframe().copy()
        
        # Keep track of baseline recommended patrols for scaling logic
        baseline_df["baseline_patrol_units"] = baseline_df["recommended_patrol_units"]

        # Validate that the dataset has the required columns for impact calc.
        self._impact_service._validate(baseline_df)

        # Apply user overrides to the working copy only.
        working_df = self._apply_overrides(baseline_df.copy(), allocations)

        # Compute impact on baseline (no overrides) and on the working copy.
        baseline_impact = self._impact_service.calculate(baseline_df)
        simulated_impact = self._impact_service.calculate(working_df)
        
        # Restore baseline values for all non-impacted cells (delta == 0)
        INITIAL_ALLOCATIONS = {
            "89618924b93ffff": 1,
            "89618921ab7ffff": 1,
            "89601458377ffff": 1,
            "896189255b7ffff": 1,
        }
        all_cells = set(list(INITIAL_ALLOCATIONS.keys()) + list(allocations.keys()))
        impacted_h3s = [h3 for h3 in all_cells if INITIAL_ALLOCATIONS.get(h3, 0) != allocations.get(h3, 0)]

        if impacted_h3s:
            mask = ~simulated_impact["h3_index"].isin(impacted_h3s)
            cols_to_restore = [
                "recommended_patrol_units",
                "estimated_enforcement_effectiveness",
                "estimated_weekly_violations_addressed",
                "projected_tdpi",
                "operational_improvement_percent",
                "visibility_gap_index",
                "deployment_effectiveness",
                "patrol_roi",
                "estimated_remaining_risk",
                "decision_confidence",
                "executive_summary"
            ]
            for col in cols_to_restore:
                if col in simulated_impact.columns and col in baseline_impact.columns:
                    baseline_lookup = baseline_impact.set_index("h3_index")[col]
                    simulated_impact.loc[mask, col] = simulated_impact.loc[mask, "h3_index"].map(baseline_lookup)
        
        # Apply temporal intelligence weights if hour is specified
        if hour is not None:
            baseline_impact = self._apply_temporal_scaling(baseline_impact, hour)
            simulated_impact = self._apply_temporal_scaling(simulated_impact, hour)

        # Build response using DataStore's cleaner to sanitise NaN / numpy types.
        from app.core.data_store import data_store  # lazy import avoids circular deps

        baseline_records = data_store._records(baseline_impact)
        simulated_records = data_store._records(simulated_impact)

        summary = self._build_comparison_summary(
            baseline_impact, simulated_impact, allocations
        )

        LOG.info(
            f"PatrolSimulationService.simulate complete. "
            f"Avg projected TDPI: baseline={summary['baseline_avg_projected_tdpi']}, "
            f"simulated={summary['simulated_avg_projected_tdpi']}"
        )

        return {
            "baseline": baseline_records,
            "simulated": simulated_records,
            "summary": summary,
        }

    # ------------------------------------------------------------------ #
    # Private Helpers                                                      #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _apply_overrides(
        df: pd.DataFrame,
        allocations: dict[str, int],
    ) -> pd.DataFrame:
        """
        Adjust ``recommended_patrol_units`` based on squad reallocations.

        Calculates the delta relative to the initial squad deployments:
        - Squad Alpha: 89618924b93ffff
        - Squad Beta: 89618921ab7ffff
        - Squad Gamma: 89601458377ffff
        - Squad Delta: 896189255b7ffff
        """
        if "h3_index" not in df.columns:
            LOG.warning(
                "PatrolSimulationService: DataFrame has no 'h3_index' column. "
                "Overrides cannot be applied."
            )
            return df

        INITIAL_ALLOCATIONS = {
            "89618924b93ffff": 1,
            "89618921ab7ffff": 1,
            "89601458377ffff": 1,
            "896189255b7ffff": 1,
        }

        # Build union of cells that are/were overridden
        all_cells = set(list(INITIAL_ALLOCATIONS.keys()) + list(allocations.keys()))

        for h3_index in all_cells:
            initial_val = INITIAL_ALLOCATIONS.get(h3_index, 0)
            current_val = allocations.get(h3_index, 0)
            delta = current_val - initial_val

            if delta != 0:
                mask = df["h3_index"] == h3_index
                if mask.any():
                    val = df.loc[mask, "recommended_patrol_units"].values[0]
                    df.loc[mask, "recommended_patrol_units"] = max(0, int(val + delta))
                else:
                    LOG.warning(
                        f"PatrolSimulationService: H3 index '{h3_index}' not found "
                        f"in patrol dataset — override ignored."
                    )

        return df

    @staticmethod
    def _apply_temporal_scaling(
        df: pd.DataFrame,
        hour: int,
    ) -> pd.DataFrame:
        from app.core.data_store import data_store
        
        temporal_df = data_store.get("temporal")
        temporal_df = temporal_df[temporal_df["hour"] == hour]
        
        # Merge weight onto df
        merged = df.merge(temporal_df[["h3_index", "temporal_weight"]], on="h3_index", how="left")
        
        # Default weight to uniform (1/24) if not found
        weight = merged["temporal_weight"].fillna(1.0 / 24.0)
        
        # Scale variables according to implementation plan
        df["tdpi_score"] = np.minimum(100.0, df["tdpi_score"] * weight * 24.0).round(2)
        df["projected_tdpi"] = np.minimum(100.0, df["projected_tdpi"] * weight * 24.0).round(2)
        df["predicted_violations"] = (df["predicted_violations"] * weight).round(2)
        df["estimated_weekly_violations_addressed"] = (df["estimated_weekly_violations_addressed"] * weight).round(2)
        
        # Optionally, recalculate operational improvement based on hourly TDPI? 
        # The plan doesn't specify, but let's do it to keep it consistent.
        # However, the plan only specifies the 4 variables above. We will stick to the plan.
        
        return df

    @staticmethod
    def _build_comparison_summary(
        baseline_df: pd.DataFrame,
        simulated_df: pd.DataFrame,
        allocations: dict[str, int],
    ) -> dict[str, Any]:
        """
        Build a high-level comparison between baseline and simulated projections.
        """

        def _safe_mean(df: pd.DataFrame, col: str) -> float:
            if col in df.columns and len(df) > 0:
                return round(float(df[col].mean()), 2)
            return 0.0

        baseline_tdpi = _safe_mean(baseline_df, "projected_tdpi")
        simulated_tdpi = _safe_mean(simulated_df, "projected_tdpi")
        tdpi_delta = round(baseline_tdpi - simulated_tdpi, 2)

        baseline_improvement = _safe_mean(
            baseline_df, "operational_improvement_percent"
        )
        simulated_improvement = _safe_mean(
            simulated_df, "operational_improvement_percent"
        )

        baseline_roi = _safe_mean(baseline_df, "patrol_roi")
        simulated_roi = _safe_mean(simulated_df, "patrol_roi")

        baseline_violations = _safe_mean(
            baseline_df, "estimated_weekly_violations_addressed"
        )
        simulated_violations = _safe_mean(
            simulated_df, "estimated_weekly_violations_addressed"
        )

        return {
            "cells_overridden": len(allocations),
            "baseline_avg_projected_tdpi": baseline_tdpi,
            "simulated_avg_projected_tdpi": simulated_tdpi,
            "projected_tdpi_delta": tdpi_delta,
            "baseline_avg_improvement_percent": baseline_improvement,
            "simulated_avg_improvement_percent": simulated_improvement,
            "baseline_avg_patrol_roi": baseline_roi,
            "simulated_avg_patrol_roi": simulated_roi,
            "baseline_avg_violations_addressed": baseline_violations,
            "simulated_avg_violations_addressed": simulated_violations,
        }


# Singleton instance
patrol_simulation_service = PatrolSimulationService()
