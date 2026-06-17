"""
ParkOptic - Validation Dataset Pipeline

Purpose:
    Build ML training dataset for the Validation Intelligence Classifier.

Inputs:
    cleaned_violations.parquet

Outputs:
    validation_dataset.parquet
    validation_metadata.parquet
    validation_dataset_report.md
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

sys.path.append(str(ROOT))

from config import (
    DOCS_DIR,
    ML_DIR,
)

from utils.logger import LOG

from app.ml.features.validation_feature_builder import (ValidationFeatureBuilder)


def main():

    LOG.info( "Starting validation dataset pipeline")

    builder = ValidationFeatureBuilder()

    dataset, metadata = (builder.build())

    ML_DIR.mkdir(parents=True,exist_ok=True,)

    dataset_path = (ML_DIR/"validation_dataset.parquet")

    metadata_path = (ML_DIR/"validation_metadata.parquet")

    dataset.to_parquet(dataset_path,index=False,)

    metadata.to_parquet(metadata_path,index=False)

    LOG.info(f"Saved dataset to {dataset_path}")

    LOG.info(f"Saved metadata to {metadata_path}")

    target_distribution = (dataset["target"].value_counts())

    approved_count = (dataset["target"].sum())

    rejected_count = (len(dataset) - approved_count)

    approval_rate = (dataset["target"].mean() * 100)


    report = f"""
# Validation Dataset Report

## Overview

Rows:
{len(dataset):,}

Columns:
{len(dataset.columns)}

Approved Records:
{approved_count:,}

Rejected/Duplicate Records:
{rejected_count:,}

Approval Rate:
{approval_rate:.2f}%

## Target Distribution

{target_distribution.to_string()}
"""

    DOCS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    report_path = (DOCS_DIR/"validation_dataset_report.md")

    with open(
        report_path,
        "w",
        encoding="utf-8",
    ) as file:

        file.write(report)

    LOG.info("Validation dataset pipeline completed")


if __name__ == "__main__":
    main()