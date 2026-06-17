"""
ParkOptic - TDPI Calculation Pipeline

Purpose:
    Generate Traffic Disruption Potential Index (TDPI)
    for all H3 hotspot zones.

Inputs:
    hex_aggregates.parquet

Outputs:
    tdpi_scores.parquet
    tdpi_report.md
"""

import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent

sys.path.append(str(ROOT))

from config import (PROCESSED_DIR,DOCS_DIR,)

from utils.logger import LOG

from app.services.tdpi_service import ( TDPIService,)


def main():

    LOG.info( "Starting TDPI calculation pipeline")

    input_path = (PROCESSED_DIR/"hex_aggregates.parquet")

    LOG.info( f"Loading {input_path}")

    df = pd.read_parquet(input_path)

    LOG.info(f"Loaded {len(df):,} H3 zones")

    tdpi_service = TDPIService()

    tdpi_df = (tdpi_service.calculate(df) )

    output_path = (PROCESSED_DIR/"tdpi_scores.parquet")

    tdpi_df.to_parquet(output_path,index=False,)

    LOG.info(f"Saved TDPI scores to {output_path}")

    DOCS_DIR.mkdir( parents=True,exist_ok=True,)

    risk_distribution = (
        tdpi_df["risk_category"]
        .value_counts()
    )

    tier_distribution = (
        tdpi_df["hotspot_tier"]
        .value_counts()
    )

    report = f"""
# ParkOptic TDPI Report

## Overview

Total Zones:
{len(tdpi_df):,}

Average TDPI:
{tdpi_df["tdpi_score"].mean():.2f}

Median TDPI:
{tdpi_df["tdpi_score"].median():.2f}

Maximum TDPI:
{tdpi_df["tdpi_score"].max():.2f}


## Risk Distribution

{risk_distribution.to_string()}


## Hotspot Tier Distribution

{tier_distribution.to_string()}


## Top 10 TDPI Zones

{tdpi_df[
    [
        "h3_index",
        "tdpi_score",
        "tdpi_percentile",
        "risk_category",
        "hotspot_tier",
        "total_violations",
    ]
]
.sort_values(
    "tdpi_score",
    ascending=False,
)
.head(10)
.to_string(index=False)}
"""

    report_path = (DOCS_DIR/"tdpi_report.md")

    with open(
        report_path,
        "w",
        encoding="utf-8",
    ) as file:

        file.write(report)

    LOG.info(f"Saved report to {report_path}")

    LOG.info("TDPI calculation completed successfully")


if __name__ == "__main__":

    main()