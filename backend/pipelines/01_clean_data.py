"""
ParkOptic - Data Cleaning Pipeline

Purpose:
    Clean and standardize Bengaluru parking violation data.

Outputs:
    - cleaned_violations.parquet
    - cleaning_report.md
    - pipeline.log
"""

import sys
from pathlib import Path

import pandas as pd


# Project Imports
ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT))

from config import (
    RAW_DATA_PATH,
    PROCESSED_DIR,
    DOCS_DIR,
)

from utils.logger import LOG



# Helper Functions
def get_peak(hour):
    """
    Categorize hours into operational peak periods.
    """

    if pd.isna(hour):
        return "UNKNOWN"

    if 7 <= hour <= 10:
        return "MORNING_PEAK"

    elif 17 <= hour <= 20:
        return "EVENING_PEAK"

    return "OFF_PEAK"



# Main Pipeline
def main():

    LOG.info("Starting ParkOptic cleaning pipeline")


    # Load Dataset
    LOG.info(f"Reading dataset from {RAW_DATA_PATH}")

    df = pd.read_csv(RAW_DATA_PATH)

    original_rows = len(df)

    LOG.info(f"Loaded {original_rows:,} rows")


    # Drop Useless Columns
    DROP_COLUMNS = [
        "description",
        "closed_datetime",
        "action_taken_timestamp",
    ]

    df.drop(
        columns=DROP_COLUMNS,
        inplace=True,
        errors="ignore",
    )

    LOG.info(
        f"Dropped {len(DROP_COLUMNS)} unused columns"
    )


    # Vehicle Corrections
    df["final_vehicle_number"] = (
        df["updated_vehicle_number"]
        .fillna(df["vehicle_number"])
    )

    df["final_vehicle_type"] = (
        df["updated_vehicle_type"]
        .fillna(df["vehicle_type"])
    )

    LOG.info(
        "Applied updated vehicle corrections"
    )

    # Timestamp Conversion
    TIMESTAMP_COLUMNS = [
        "created_datetime",
        "modified_datetime",
        "validation_timestamp",
        "data_sent_to_scita_timestamp",
    ]

    for column in TIMESTAMP_COLUMNS:

        if column in df.columns:

            df[column] = pd.to_datetime(
                df[column],
                errors="coerce",
                utc=True,
            )

            df[column] = (
                df[column]
                .dt.tz_convert("Asia/Kolkata")
            )

    LOG.info(
        "Converted timestamps to IST"
    )


    # Bengaluru Coordinate Validation

    before_filter = len(df)

    df = df[
        (df["latitude"] >= 12.80)
        &
        (df["latitude"] <= 13.20)
        &
        (df["longitude"] >= 77.40)
        &
        (df["longitude"] <= 77.80)
    ].copy()

    removed_rows = before_filter - len(df)

    LOG.info(
        f"Removed {removed_rows:,} records outside Bengaluru bounds"
    )

    # Normalize Text Fields
    TEXT_COLUMNS = [
        "violation_type",
        "validation_status",
        "final_vehicle_type",
    ]

    for column in TEXT_COLUMNS:

        if column in df.columns:

            df[column] = (
                df[column]
                .astype("string")
                .str.upper()
                .str.strip()
            )

    LOG.info(
        "Normalized text fields"
    )

    # Feature Engineering
    df["hour"] = (
        df["created_datetime"]
        .dt.hour
    )

    df["weekday"] = (
        df["created_datetime"]
        .dt.day_name()
    )

    df["month"] = (
        df["created_datetime"]
        .dt.month_name()
    )

    df["is_weekend"] = (
        df["weekday"]
        .isin(
            ["Saturday", "Sunday"]
        )
    )

    df["peak_period"] = (
        df["hour"]
        .apply(get_peak)
    )

    LOG.info(
        "Generated temporal features"
    )


    # Memory Optimization
    CATEGORY_COLUMNS = [
        "weekday",
        "month",
        "peak_period",
        "final_vehicle_type",
        "validation_status",
    ]

    for column in CATEGORY_COLUMNS:

        if column in df.columns:

            df[column] = (
                df[column]
                .astype("category")
            )

    LOG.info(
        "Applied category optimizations"
    )


    # Rename Columns
    df.rename(
        columns={
            "id": "violation_id",
        },
        inplace=True,
    )

    LOG.info(
        "Renamed identifier columns"
    )


    # Save Processed Dataset
    PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = (
        PROCESSED_DIR
        /
        "cleaned_violations.parquet"
    )

    df.to_parquet(
        output_path,
        index=False,
    )

    LOG.info(
        f"Saved processed dataset to {output_path}"
    )

    LOG.info(
        f"Final dataset shape: {df.shape}"
    )


    # Validation Status Distribution
    validation_distribution = (
        df["validation_status"]
        .value_counts(dropna=False)
    )


    # Cleaning Report
    DOCS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    report = f"""
# ParkOptic Cleaning Report

## Dataset Overview

Original Rows: {original_rows:,}

Final Rows: {len(df):,}

Rows Removed (Coordinate Filtering): {removed_rows:,}


## Coverage

Unique Police Stations:
{df["police_station"].nunique()}

Unique Junctions:
{df["junction_name"].nunique()}

Unique Device IDs:
{df["device_id"].nunique()}


## Date Range

Start:
{df["created_datetime"].min()}

End:
{df["created_datetime"].max()}


## Validation Status Distribution

{validation_distribution.to_string()}
"""

    report_path = (
        DOCS_DIR
        /
        "cleaning_report.md"
    )

    with open(
        report_path,
        "w",
        encoding="utf-8",
    ) as file:

        file.write(report)

    LOG.info(
        f"Saved cleaning report to {report_path}"
    )

    LOG.info(
        "ParkOptic cleaning pipeline completed successfully"
    )


# Entry Point
if __name__ == "__main__":

    main()