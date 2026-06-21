"""
ParkOptic - Temporal Profiles Pipeline

Purpose:
    Analyze historical cleaned violations to create an hourly
    temporal probability distribution for each H3 cell.

Inputs:
    data/processed/cleaned_violations.parquet

Outputs:
    data/processed/temporal_profiles.parquet
"""

import sys
from pathlib import Path

# Project Imports
ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT))
sys.path.append(r"D:\parkoptic\backend\venv\Lib\site-packages")

import pandas as pd
import h3

from config import PROCESSED_DIR
from utils.logger import LOG

H3_RESOLUTION = 9

def main():
    LOG.info("Starting Temporal Profiles generation pipeline")

    input_path = PROCESSED_DIR / "cleaned_violations.parquet"
    LOG.info(f"Loading {input_path}")
    df = pd.read_parquet(input_path)
    LOG.info(f"Loaded {len(df):,} cleaned violations")

    LOG.info(f"Generating H3 indices (resolution={H3_RESOLUTION})")
    df["h3_index"] = [
        h3.latlng_to_cell(lat, lon, H3_RESOLUTION)
        for lat, lon in zip(df["latitude"], df["longitude"])
    ]

    LOG.info("Calculating temporal weights")
    
    # Calculate total violations per H3 cell
    h3_totals = df.groupby("h3_index").size().rename("total_count")
    
    # Calculate hourly violations per H3 cell
    hourly_counts = df.groupby(["h3_index", "hour"]).size().rename("hourly_count").reset_index()
    
    # Merge and calculate weights
    merged = hourly_counts.merge(h3_totals, on="h3_index")
    merged["temporal_weight"] = merged["hourly_count"] / merged["total_count"]
    
    # Create complete grid for all 24 hours per H3 cell (filling missing hours with 0)
    unique_h3 = merged["h3_index"].unique()
    all_hours = pd.DataFrame([(h, h3) for h3 in unique_h3 for h in range(24)], columns=["hour", "h3_index"])
    
    temporal_profiles = all_hours.merge(merged, on=["h3_index", "hour"], how="left")
    temporal_profiles["hourly_count"] = temporal_profiles["hourly_count"].fillna(0).astype(int)
    temporal_profiles["total_count"] = temporal_profiles["total_count"].fillna(0).astype(int)
    temporal_profiles["temporal_weight"] = temporal_profiles["temporal_weight"].fillna(0.0)
    
    output_path = PROCESSED_DIR / "temporal_profiles.parquet"
    temporal_profiles.to_parquet(output_path, index=False)
    
    LOG.info(f"Saved temporal profiles: {output_path}")
    LOG.info(f"Generated profiles for {len(unique_h3):,} unique H3 cells ({len(temporal_profiles):,} total records)")

if __name__ == "__main__":
    main()
