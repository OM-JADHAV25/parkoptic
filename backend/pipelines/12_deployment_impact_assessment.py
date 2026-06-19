"""
ParkOptic - Deployment Impact Assessment Pipeline

"""

from pathlib import Path
import sys

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT))

from config import (PROCESSED_DIR,DOCS_DIR,)

from app.services.deployment_impact_assessment_service import (DeploymentImpactAssessmentService,)

from utils.logger import LOG


def main():

    LOG.info("Starting Deployment Impact Assessment Pipeline")

    input_path = (PROCESSED_DIR /"patrol_recommendations.parquet")

    if not input_path.exists():
        raise FileNotFoundError(f"Input dataset not found: {input_path}")

    LOG.info(f"Loading {input_path}")

    df = pd.read_parquet(input_path)

    LOG.info(f"Loaded {len(df):,} hotspot records")

    service = (DeploymentImpactAssessmentService())

    result = service.calculate(df)

    output_path = (PROCESSED_DIR /"deployment_impact.parquet")

    result.to_parquet(output_path,index=False,)

    LOG.info(f"Saved deployment impact dataset to {output_path}")


    # Report
    DOCS_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    avg_improvement = (result["operational_improvement_percent"].mean())

    avg_roi = (result["patrol_roi"].mean())

    avg_confidence = (result["decision_confidence"].mean())

    total_addressed = (result["estimated_weekly_violations_addressed"].sum())

    priority_distribution = (result["deployment_effectiveness"].value_counts())

    report = f"""
# Deployment Impact Assessment Report

## Dataset

Hotspots Evaluated: {len(result):,}

## Estimated Operational Impact

Average Operational Improvement: {avg_improvement:.2f}%

Average Patrol ROI: {avg_roi:.2f}

Average Decision Confidence:{avg_confidence:.2f}

Estimated Weekly Violations Addressed: {total_addressed:.0f}

## Deployment Effectiveness Distribution
{priority_distribution.to_string()}

## Top 10 Highest Impact Hotspots

{result[
[
"impact_rank",
"h3_index",
"deployment_priority",
"recommended_patrol_units",
"operational_improvement_percent",
"patrol_roi",
]
]
.head(10)
.to_string(index=False)}
"""

    report_path = (DOCS_DIR /"deployment_impact_report.md")

    with open(
        report_path,
        "w",
        encoding="utf-8",
    ) as file:
        file.write(report)

    LOG.info(f"Saved report to {report_path}")

    LOG.info("Deployment Impact Assessment completed successfully.")
    
if __name__ == "__main__":

    main()