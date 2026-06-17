"""
ParkOptic - H3 Spatial Aggregation Pipeline

Purpose:
    Convert cleaned parking violations into H3 hexagonal zones
    for hotspot analysis and spatial intelligence.

Inputs:
    data/processed/cleaned_violations.parquet

Outputs:
    data/processed/hex_aggregates.parquet
    docs/h3_aggregation_report.md
"""

import sys
from pathlib import Path

import pandas as pd
import h3


# Project Imports
ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT))

from config import ( PROCESSED_DIR,DOCS_DIR,)

from utils.logger import LOG


# Configuration
H3_RESOLUTION = 9


# Main Pipeline
def main():

    LOG.info("Starting ParkOptic H3 aggregation pipeline")


    # Load Cleaned Dataset
    input_path = ( PROCESSED_DIR /"cleaned_violations.parquet" )

    LOG.info(f"Loading {input_path}")

    df = pd.read_parquet(input_path)

    # Convert categoricals back to strings for processing
    df["validation_status"] = (
        df["validation_status"]
        .astype("string")
    )

    df["final_vehicle_type"] = (
        df["final_vehicle_type"]
        .astype("string")
    )


    LOG.info( f"Loaded {len(df):,} cleaned violations" )


    # Generate H3 Indices
    LOG.info( f"Generating H3 indices (resolution={H3_RESOLUTION})")

    df["h3_index"] = [
        h3.latlng_to_cell(lat, lon, H3_RESOLUTION)
        for lat, lon in zip(
            df["latitude"],
            df["longitude"],
        )
    ]

    LOG.info( f"Generated {df['h3_index'].nunique():,} unique H3 cells")


    # Approval Flag
    df["is_approved"] = (
        df["validation_status"]
        .fillna("UNKNOWN")
        .eq("APPROVED")
    )


    # Aggregate to Hex Level
    LOG.info("Aggregating spatial statistics" )

    hex_df = (
        df.groupby(
            "h3_index",
            observed=True,
        )
        .agg(
            total_violations=(
                "violation_id",
                "count",
            ),

            approved_violations=(
                "is_approved",
                "sum",
            ),

            violation_types=(
                "violation_type",
                "nunique",
            ),

            unique_vehicles=(
                "final_vehicle_number",
                "nunique",
            ),

            repeat_offenders=(
                "final_vehicle_number",
                lambda x: (
                    x.value_counts()
                   .gt(1)
                   .sum()
                ),
            ),

            vehicle_types=(
                "final_vehicle_type",
                "nunique",
            ),

            unique_devices=(
                "device_id",
                "nunique",
            ),

            police_stations=(
                "police_station",
                "nunique",
            ),

            junctions=(
                "junction_name",
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

            first_seen=(
                "created_datetime",
                "min",
            ),

            last_seen=(
                "created_datetime",
                "max",
            ),

            active_days=(
                "created_datetime",
                lambda x: (
                    x.dt.date.nunique()
                ),
            ),
        )
        .reset_index()
    )


    # Derived Metrics
    LOG.info( "Computing derived hotspot metrics" )

    hex_df["approval_rate"] = (
        ( hex_df["approved_violations"] / hex_df["total_violations"])
        .fillna(0)
        .round(4)
    )

    hex_df["violations_per_day"] = (
        ( hex_df["total_violations"] / hex_df["active_days"])
        .fillna(0)
        .round(2)
    )

    # Hotspot Ranking
    hex_df["hotspot_rank"] = (
        hex_df["total_violations"]
        .rank(
            ascending=False,
            method="dense",
        )
        .astype(int)
    )


    # Pareto Analysis
    hex_df = (
        hex_df.sort_values(
            "total_violations",
            ascending=False,
        )
        .reset_index(drop=True)
    )

    total_city_violations = (
        hex_df["total_violations"]
        .sum()
    )

    hex_df["cumulative_violations"] = (
        hex_df["total_violations"]
        .cumsum()
    )

    hex_df["cumulative_percentage"] = (
        ( hex_df["cumulative_violations"] / total_city_violations ) * 100
    ).round(2)


    # Save Aggregates
    output_path = (PROCESSED_DIR / "hex_aggregates.parquet" )

    hex_df.to_parquet(
        output_path,
        index=False,
    )

    LOG.info( f"Saved {len(hex_df):,} H3 zones to {output_path}" )


    # Generate Report
    DOCS_DIR.mkdir( parents=True, exist_ok=True, )

    top_50_share = (
        hex_df.head(50)[
            "total_violations"
        ].sum()
        /
        total_city_violations
    ) * 100

    top_100_share = (
        hex_df.head(100)[
            "total_violations"
        ].sum()
        /
        total_city_violations
    ) * 100

    LOG.info(
        f"Top 100 zones contribute "
        f"{top_100_share:.2f}% of city violations"
    )

    report = f"""
# ParkOptic H3 Aggregation Report

## Configuration

H3 Resolution: {H3_RESOLUTION}


## Spatial Coverage

Total Hex Zones:
{len(hex_df):,}


Total Violations:
{total_city_violations:,}


Average Violations Per Zone:
{hex_df["total_violations"].mean():.2f}


Maximum Violations In A Zone:
{hex_df["total_violations"].max():,}


Median Violations Per Zone:
{hex_df["total_violations"].median():.2f}


## Pareto Analysis

Top 50 Zones Share:
{top_50_share:.2f}%

Top 100 Zones Share:
{top_100_share:.2f}%


Top 10 Zones

{hex_df[
    [
        "h3_index",
        "total_violations",
        "approved_violations",
        "hotspot_rank",
    ]
].head(10).to_string(index=False)}
"""

    report_path = (DOCS_DIR / "h3_aggregation_report.md")

    with open(
        report_path,
        "w",
        encoding="utf-8",
    ) as file:

        file.write(report)

    LOG.info( f"Saved report to {report_path}"  )

    LOG.info("ParkOptic H3 aggregation completed successfully")


# Entry Point
if __name__ == "__main__":

    main()