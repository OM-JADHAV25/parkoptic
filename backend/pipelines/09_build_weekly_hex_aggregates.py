"""
ParkOptic - Weekly H3 Aggregation Pipeline

Purpose:
    Build weekly H3 hotspot observations
    for forecasting and trend analysis.

Inputs:
    cleaned_violations.parquet

Outputs:
    weekly_hex_aggregates.parquet
    weekly_hex_aggregation_report.md
"""

import sys
from pathlib import Path

import pandas as pd
import h3


ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT))

from config import (
    PROCESSED_DIR,
    DOCS_DIR,
)

from utils.logger import LOG


H3_RESOLUTION = 9


def main():

    LOG.info("Starting weekly H3 aggregation pipeline")

    input_path = (PROCESSED_DIR/"cleaned_violations.parquet")

    df = pd.read_parquet(input_path)

    LOG.info(f"Loaded {len(df):,} violations")


    # H3 Index Generation
    df["h3_index"] = [
        h3.latlng_to_cell(
            lat,
            lon,
            H3_RESOLUTION,
        )
        for lat, lon in zip(
            df["latitude"],
            df["longitude"],
        )
    ]

    # Convert categoricals for processing
    df["validation_status"] = (
        df["validation_status"]
        .astype("string")
    )

    df["final_vehicle_type"] = (
        df["final_vehicle_type"]
        .astype("string")
    )


    # Week Extraction
    df["week_start"] = (
        df["created_datetime"]
        .dt.to_period("W")
        .dt.start_time
    )


    # Approval Flag
    df["is_approved"] = (
        df["validation_status"]
        .fillna("UNKNOWN")
        .eq("APPROVED")
    )

    # -----------------------------------------
    # Weekly Aggregation
    # -----------------------------------------

    LOG.info("Building weekly hotspot observations")

    weekly_df = (
        df.groupby(
            ["h3_index","week_start",],
            observed=True,
        )
        .agg(
            weekly_violations=(
                "violation_id",
                "count",
            ),

            weekly_approved_violations=(
                "is_approved",
                "sum",
            ),

            weekly_unique_vehicles=(
                "final_vehicle_number",
                "nunique",
            ),

            weekly_repeat_offenders=(
                "final_vehicle_number",
                lambda x:
                x.value_counts()
                .gt(1)
                .sum(),
            ),

            weekly_unique_devices=(
                "device_id",
                "nunique",
            ),

            latitude=(
                "latitude",
                "mean",
            ),

            longitude=(
                "longitude",
                "mean",
            ),

            active_days=(
                "created_datetime",
                lambda x:
                x.dt.date.nunique(),
            ),
        )
        .reset_index()
    )

    # Derived Metrics
    weekly_df[
        "weekly_approval_rate"
    ] = (
        weekly_df["weekly_approved_violations"] / weekly_df["weekly_violations"]
    ).fillna(0)

    weekly_df[
        "weekly_violations_per_day"
    ] = (weekly_df["weekly_violations"] / weekly_df["active_days"]
    ).fillna(0)


    # Save Dataset
    output_path = (PROCESSED_DIR/"weekly_hex_aggregates.parquet")

    weekly_df.to_parquet(
        output_path,
        index=False,
    )

    LOG.info(f"Saved {len(weekly_df):,} weekly observations")


    # Report
    DOCS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    report = f"""
# Weekly H3 Aggregation Report

## Dataset Summary

Rows: {len(weekly_df):,}

Unique H3 Cells: {weekly_df['h3_index'].nunique():,}

Weeks: {weekly_df['week_start'].nunique():,}

Average Weekly Violations: {weekly_df['weekly_violations'].mean():.2f}

Maximum Weekly Violations: {weekly_df['weekly_violations'].max():,}
"""

    report_path = (DOCS_DIR/"weekly_h3_aggregation_report.md")

    with open(
        report_path,
        "w",
        encoding="utf-8",
    ) as file:

        file.write(report)

    LOG.info(f"Saved report to {report_path}")

    LOG.info("Weekly H3 aggregation completed")


if __name__ == "__main__":
    main()