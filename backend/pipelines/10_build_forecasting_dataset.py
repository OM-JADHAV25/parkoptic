"""
ParkOptic - Forecast Dataset Pipeline
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

sys.path.append(str(ROOT))

from config import (PROCESSED_DIR,DOCS_DIR)

from utils.logger import LOG

from app.ml.features.hotspot_forecasting_feature_builder import (HotspotForecastingFeatureBuilder,)


def main():

    LOG.info("Building forecasting dataset")

    builder = (HotspotForecastingFeatureBuilder())

    dataset = (builder.build())

    output_path = (PROCESSED_DIR/"forecasting_dataset.parquet")

    dataset.to_parquet(
        output_path,
        index=False,
    )

    report = f"""
# Forecasting Dataset Report

Rows: {len(dataset):,}

Unique H3 Cells: {dataset['h3_index'].nunique():,}

Features: {len(dataset.columns)}
"""

    report_path = (DOCS_DIR/"forecasting_dataset_report.md")

    with open(
        report_path,
        "w",
        encoding="utf-8",
    ) as file:

        file.write(report)

    LOG.info(f"Saved dataset: {output_path}")

    LOG.info(f"Rows: {len(dataset):,}")


if __name__ == "__main__":
    main()