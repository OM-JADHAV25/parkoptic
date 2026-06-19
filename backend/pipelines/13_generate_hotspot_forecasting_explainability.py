"""
ParkOptic - Hotspot Forecasting Explainability Pipeline

Purpose:
    Generate SHAP explainability artifacts for the
    Hotspot Forecasting Model.

Inputs:
    models/hotspot_forecasting_model.cbm
    data/ml/forecasting_dataset.parquet

Outputs:
    artifacts/hotspot_forecasting/
        - shap_summary.png
        - shap_bar.png
        - shap_waterfall.png
        - shap_values.parquet
        - feature_importance.csv

    docs/hotspot_forecasting_explainability_report.md
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT))

from app.ml.explainability.hotspot_forecasting_explainer import (HotspotForecastingExplainer)

from utils.logger import LOG


def main():

    LOG.info("Starting Hotspot Forecasting Explainability Pipeline")

    explainer = HotspotForecastingExplainer()

    importance = explainer.explain()

    LOG.info(
        f"Generated SHAP explanations for "
        f"{len(importance):,} features"
    )

    LOG.info("Top 10 Most Important Features")

    for _, row in (
        importance.head(10).iterrows()
    ):

        LOG.info(
            f"{row['feature']:<35}"
            f"{row['importance']:.4f}"
        )

    LOG.info(
        "Hotspot Forecasting Explainability "
        "completed successfully."
    )


if __name__ == "__main__":

    main()