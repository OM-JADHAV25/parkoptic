"""
ParkOptic - Patrol Optimizer Pipeline

Purpose:
    Generate deployment recommendations
    for enforcement teams based on:

    - TDPI
    - Visibility Gap Index
    - Hotspot Tier

Inputs:
    visibility_gap.parquet

Outputs:
    patrol_recommendations.parquet
    patrol_optimizer_report.md
"""

import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent

sys.path.append(str(ROOT))

from config import (PROCESSED_DIR,DOCS_DIR,)

from utils.logger import LOG

from app.services.smart_patrol_allocation_service import (SmartPatrolAllocationService)

def main():

    LOG.info("Starting Patrol Optimizer Pipeline")

    input_path = (PROCESSED_DIR/"visibility_gap.parquet")

    LOG.info(f"Loading {input_path}")

    df = pd.read_parquet(input_path)

    forecast = pd.read_parquet(PROCESSED_DIR/"forecast_predictions.parquet")

    forecast = (
        forecast.groupby("h3_index", as_index=False)
            .agg(predicted_violations=("predicted_violations", "mean")
        )
    )

    df = df.merge(forecast,on="h3_index",how="left")

    df["predicted_violations"] = (
        df["predicted_violations"].fillna(0)
    )

    LOG.info(f"Loaded {len(df):,} zones")

    service = SmartPatrolAllocationService()

    result = service.calculate(df)


    # Save Dataset
    output_path = (PROCESSED_DIR/"patrol_recommendations.parquet")

    result.to_parquet(output_path,index=False,)

    LOG.info(f"Saved recommendations to {output_path}")


    # Priority Distribution
    priority_distribution = (
        result["deployment_priority"].value_counts()
    )


    # Top Deployment Zones
    top_10 = (
        result[
            [
                "deployment_rank",
                "h3_index",
                "deployment_score",
                "deployment_priority",
                "recommended_patrol_units",
                "tdpi_score",
                "visibility_gap_index",
                "predicted_violations",
                "estimated_operational_risk_reduction",
                "recommendation_reason",
            ]
        ]
        .sort_values(
            "deployment_score",
            ascending=False,
        )
        .head(10)
    )

    # Report
    DOCS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    report = f"""
# ParkOptic Patrol Optimizer Report

## Overview

Total Zones: {len(result):,}

Average Deployment Score: {result["deployment_score"].mean():.2f}

Maximum Deployment Score: {result["deployment_score"].max():.2f}

Average Recommended Patrol Units: {result["recommended_patrol_units"].mean():.2f}

Immediate Deployments: {(result["deployment_priority"]=="IMMEDIATE").sum()}

Average Operational Risk Reduction: {result["estimated_operational_risk_reduction"].mean():.2f}%

## Deployment Priority Distribution
# {priority_distribution.to_string()}


## Top 10 Deployment Zones

{top_10.to_string(index=False)}
"""

    report_path = (DOCS_DIR/"patrol_optimizer_report.md")

    with open(
        report_path,
        "w",
        encoding="utf-8",
    ) as file:

        file.write(report)

    LOG.info(f"Saved report to {report_path}")

    LOG.info("Patrol Optimizer Pipeline Completed")

if __name__ == "__main__":
    main()