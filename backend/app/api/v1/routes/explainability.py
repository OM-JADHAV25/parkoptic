"""Explainability API routes."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.core.data_store import data_store
from app.core.settings import settings
from app.schemas.explainability import ExplainabilityArtifacts, HotspotExplainability


router = APIRouter()


def _artifact(path: Path) -> dict:
    return {
        "path": str(path),
        "exists": path.exists(),
        "size_mb": round(path.stat().st_size / 1024 / 1024, 2) if path.exists() else 0,
    }


@router.get(
    "/artifacts",
    response_model=ExplainabilityArtifacts,
    summary="Explainability Artifact Status",
)
async def explainability_artifacts():
    forecast_dir = settings.ARTIFACTS_DIR / "hotspot_forecasting"

    return {
        "artifacts": {
            "validation_shap_summary": _artifact(settings.ARTIFACTS_DIR / "violation_validation_shap_summary.png"),
            "validation_shap_bar": _artifact(settings.ARTIFACTS_DIR / "violation_validation_shap_bar.png"),
            "forecast_shap_summary": _artifact(forecast_dir / "shap_summary.png"),
            "forecast_shap_bar": _artifact(forecast_dir / "shap_bar.png"),
            "forecast_shap_waterfall": _artifact(forecast_dir / "shap_waterfall.png"),
            "forecast_feature_importance": _artifact(forecast_dir / "feature_importance.csv"),
            "forecast_shap_values": _artifact(forecast_dir / "shap_values.parquet"),
        }
    }


@router.get(
    "/forecast/features",
    summary="Hotspot Forecasting Feature Importance",
)
async def forecast_feature_importance():
    path = settings.ARTIFACTS_DIR / "hotspot_forecasting" / "feature_importance.csv"

    if not path.exists():
        raise HTTPException(status_code=404, detail="Feature importance artifact not found.")

    import pandas as pd

    df = pd.read_csv(path)
    return data_store._records(df)


@router.get(
    "/{h3_index}",
    response_model=HotspotExplainability,
    summary="Explainability Context For H3 Cell",
)
async def explain_hotspot(h3_index: str):
    hotspot = data_store.hotspot_cache.get(h3_index)

    if hotspot is None:
        raise HTTPException(status_code=404, detail="Hotspot not found.")

    return {
        "h3_index": h3_index,
        "tdpi": hotspot.get("tdpi"),
        "forecast": hotspot.get("forecast"),
        "visibility_gap": hotspot.get("visibility_gap"),
        "deployment": hotspot.get("deployment"),
    }
