"""
ParkOptic - Hotspot Repository

Provides high-performance access to unified hotspot
intelligence stored in the in-memory hotspot cache.
"""

from __future__ import annotations

from typing import Any

from app.core.data_store import data_store


class HotspotRepository:
    """
    Repository for unified hotspot intelligence.

    Data is served directly from the in-memory
    hotspot cache for maximum performance.
    """


    # Get All Hotspots
    def all(self) -> list[dict[str, Any]]:
        """
        Return every hotspot.
        """

        return list(data_store.hotspot_cache.values())

    # Get One Hotspot
    def get(
        self,
        h3_index: str,
    ) -> dict[str, Any] | None:
        """
        Retrieve a hotspot by H3 index.
        """

        return data_store.hotspot_cache.get(h3_index)

  
    # Exists
    def exists(
        self,
        h3_index: str,
    ) -> bool:

        return (h3_index in data_store.hotspot_cache)

  
    # Count
    def count(self) -> int:

        return len(data_store.hotspot_cache)

    
    # Search
    def search(
        self,
        tier: str | None = None,
        risk: str | None = None,
        priority: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Search hotspots using business filters.
        """

        results = []

        for hotspot in data_store.hotspot_cache.values():

            tdpi = hotspot.get("tdpi", {})
            deployment = hotspot.get("deployment", {})

            if (tier and tdpi.get("hotspot_tier") != tier):
                continue

            if (risk and tdpi.get("risk_category") != risk):
                continue

            if (priority and deployment and deployment.get("deployment_priority") != priority):
                continue

            results.append(hotspot)

        return results


    # Top Hotspots
    def top(
        self,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """
        Return highest priority hotspots.
        """

        hotspots = sorted(

            data_store.hotspot_cache.values(),

            key=lambda hotspot: (
                hotspot
                .get("deployment", {})
                .get("deployment_rank",999999)
            )
        )

        return hotspots[:limit]


    # Map Summary
    def map_summary(self) -> list[dict[str, Any]]:
        """
        Lightweight hotspot payload for rendering the map.
        Only returns fields required for map visualization.
        """

        hotspots = []

        for hotspot in data_store.hotspot_cache.values():

            tdpi = hotspot.get("tdpi", {})
            deployment = hotspot.get("deployment", {})

            hotspots.append({
                "h3_index": hotspot["h3_index"],
                "latitude": hotspot["latitude"],
                "longitude": hotspot["longitude"],
                "tdpi_score": tdpi.get("tdpi_score"),
                "hotspot_tier": tdpi.get("hotspot_tier"),
                "risk_category": tdpi.get("risk_category"),
                "visibility_gap_index": (
                    hotspot
                    .get("visibility_gap", {})
                    .get("visibility_gap_index")
                ),
                "deployment_priority": (
                    deployment.get("deployment_priority")
                ),

                "deployment_score": (
                    deployment.get("deployment_score")
                )
            })

        return hotspots


# Singleton Repository
hotspot_repository = HotspotRepository()
