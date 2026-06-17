"""
ParkOptic - Visibility Gap Pipeline

Purpose:
    Identify high-disruption zones with insufficient
    enforcement visibility.

Inputs:
    tdpi_scores.parquet

Outputs:
    visibility_gap.parquet
    visibility_gap_report.md
"""

import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent

sys.path.append(str(ROOT))

from config import (PROCESSED_DIR,DOCS_DIR,)

from utils.logger import LOG

from app.services.visibility_gap_service import (VisibilityGapService,)


def main():

    LOG.info("Starting Visibility Gap Pipeline")

    input_path = (PROCESSED_DIR/"tdpi_scores.parquet")

    LOG.info(f"Loading {input_path}")

    df = pd.read_parquet(input_path)

    LOG.info(f"Loaded {len(df):,} zones")

    service = VisibilityGapService()

    result = service.calculate(df)


    # Save Dataset
    output_path = (PROCESSED_DIR/"visibility_gap.parquet")

    result.to_parquet(output_path,index=False,)

    LOG.info(f"Saved visibility gap dataset to {output_path}")


    # Report Data
    gap_distribution = (result["gap_category"].value_counts())

    top_10_vgi = (
        result[
            [
                "recommended_priority",
                "h3_index",
                "visibility_gap_index",
                "vgi_percentile",
                "gap_category",
                "tdpi_score",
                "coverage_score",
                "total_violations",
            ]
        ]
        .sort_values(
            "visibility_gap_index",
            ascending=False,
        )
        .head(10)
    )


    # Generate Report
    DOCS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    report = f"""
# ParkOptic Visibility Gap Report

## Overview

Total Zones:
{len(result):,}

Average visibility_gap_index (VGI):
{result["visibility_gap_index"].mean():.2f}

Median visibility_gap_index (VGI):
{result["visibility_gap_index"].median():.2f}

Maximum visibility_gap_index (VGI):
{result["visibility_gap_index"].max():.2f}


## Gap Distribution

{gap_distribution.to_string()}


## Top 10 Visibility Gap Zones

{top_10_vgi.to_string(index=False)}
"""

    report_path = (
        DOCS_DIR/"visibility_gap_report.md")

    with open(
        report_path,
        "w",
        encoding="utf-8",
    ) as file:

        file.write(report)

    LOG.info(f"Saved report to {report_path}")

    LOG.info("Visibility Gap Pipeline Completed")


if __name__ == "__main__":
    main()