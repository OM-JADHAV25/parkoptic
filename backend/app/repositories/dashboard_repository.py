"""
ParkOptic - Dashboard Repository

Provides aggregated dashboard intelligence for
the ParkOptic homepage.
"""

from __future__ import annotations

from typing import Any

from app.core.data_store import data_store
from app.repositories.hotspot_repository import hotspot_repository


class DashboardRepository:
    """
    Repository for dashboard analytics.
    """

    # Dashboard
    def summary(self) -> dict[str, Any]:

        hotspots = hotspot_repository.all()
        total_hotspots = len(hotspots)
        tier_distribution: dict[str, int] = {}
        risk_distribution: dict[str, int] = {}
        total_tdpi = 0.0
        total_forecast = 0.0
        forecast_count = 0
        immediate_deployments = 0
        deployment_score = 0.0
        deployment_count = 0
        total_visibility_gap = 0.0
        visibility_gap_count = 0

        for hotspot in hotspots:

            tdpi = hotspot.get("tdpi") or {}
            forecast = hotspot.get("forecast") or {}
            deployment = hotspot.get("deployment") or {}
            visibility_gap_data = hotspot.get("visibility_gap") or {}

            # Tier Distribution
            tier = tdpi.get("hotspot_tier")

            if tier:
                tier_distribution[tier] = (tier_distribution.get(tier, 0) + 1)

            # Risk Distribution
            risk = tdpi.get("risk_category")

            if risk:
                risk_distribution[risk] = (risk_distribution.get(risk, 0) + 1)

            # TDPI
            score = tdpi.get("tdpi_score")

            if score is not None:
                total_tdpi += score

            # Forecast
            prediction = forecast.get("predicted_violations")

            if prediction is not None:
                total_forecast += prediction
                forecast_count += 1

            # Deployment
            if (deployment.get("deployment_priority") == "IMMEDIATE"):
                immediate_deployments += 1

            deployment_value = deployment.get("deployment_score")

            if deployment_value is not None:
                deployment_score += deployment_value
                deployment_count += 1

            # Visibility Gap
            vg_index = visibility_gap_data.get("visibility_gap_index")
            if vg_index is not None:
                total_visibility_gap += vg_index
                visibility_gap_count += 1

        return {
            "overview": {
                "total_hotspots": total_hotspots,
                "average_tdpi": round(total_tdpi / max(total_hotspots, 1), 2),
                "average_forecast": round(total_forecast / max(forecast_count, 1), 2),
                "average_deployment_score": round(deployment_score / max(deployment_count, 1), 2),
                "immediate_deployments": immediate_deployments,
                "average_visibility_gap": round(total_visibility_gap / max(visibility_gap_count, 1), 2)
            },
            "tier_distribution": tier_distribution,
            "risk_distribution": risk_distribution,
            "top_hotspots": hotspot_repository.top(10),
            "system": {
                "load_timestamp": data_store.load_timestamp.isoformat() if data_store.load_timestamp else None,
                "datasets": data_store.info(),
            },
        }


dashboard_repository = DashboardRepository()
