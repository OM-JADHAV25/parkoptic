"""
Temporal Intelligence Service
"""

from typing import Any
import pandas as pd

from app.core.data_store import data_store
from app.repositories.hotspot_repository import hotspot_repository
from app.schemas.hotspot import MapHotspot


class TemporalIntelligenceService:
    
    def get_hourly_estimates(self, hour: int) -> list[MapHotspot]:
        """
        Enriches the validated weekly forecast using historical hourly probability
        distributions to produce hour-by-hour operational intelligence.
        """
        # 1. Fetch existing un-mutated hotspots
        hotspots = hotspot_repository.map_summary()
        
        # 2. Fetch temporal dataset
        try:
            temporal_df = data_store.get("temporal")
            forecast_df = data_store.get("forecast")
        except KeyError:
            # If dataset fails to load, gracefully return unmodified hotspots
            return hotspots
            
        if temporal_df.empty:
            return hotspots
            
        # 3. Filter for requested hour
        hour_df = temporal_df[temporal_df["hour"] == hour]
        weights_map = dict(zip(hour_df["h3_index"], hour_df["temporal_weight"]))
        
        # Create a dictionary for fast forecast lookup instead of querying DataFrame per row
        forecast_map = dict(zip(forecast_df["h3_index"], forecast_df["predicted_violations"]))
        
        enriched_hotspots = []
        
        for hs in hotspots:
            # Create a copy so we NEVER modify the original ML outputs in memory
            enriched_hs = dict(hs)
            h3_index = enriched_hs.get("h3_index", "")
            
            weight = weights_map.get(h3_index, 0.0)
            enriched_hs["temporal_weight"] = round(weight, 4)
            
            weekly_prediction = forecast_map.get(h3_index, 0.0)
            enriched_hs["hourly_estimate"] = round(weekly_prediction * weight, 2)
                
            # Operational Risk (Proxy: tdpi_score * relative hourly intensity)
            tdpi = enriched_hs.get("tdpi_score")
            if tdpi is not None:
                risk = tdpi * (weight * 24)
                enriched_hs["operational_risk"] = min(100.0, round(risk, 2))
            else:
                enriched_hs["operational_risk"] = 0.0
                
            enriched_hotspots.append(enriched_hs)
            
        return enriched_hotspots

temporal_intelligence_service = TemporalIntelligenceService()
