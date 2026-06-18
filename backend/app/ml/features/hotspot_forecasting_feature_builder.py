"""
ParkOptic - Hotspot Forecasting Feature Builder

Purpose:
    Transform weekly H3 hotspot observations into a supervised
    machine learning dataset for hotspot escalation forecasting.

    This pipeline engineers temporal, historical, and statistical
    features required for predicting next-week parking enforcement
    pressure.

Inputs:
    data/processed/weekly_hex_aggregates.parquet

Outputs:
    pandas.DataFrame
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from config import PROCESSED_DIR
from utils.logger import LOG


class HotspotForecastingFeatureBuilder:
    """
    Builds the supervised forecasting dataset used by the
    Hotspot Escalation Forecasting Model.
    """

    INPUT_FILE = "weekly_hex_aggregates.parquet"

    TARGET_COLUMN = "target_next_week_violations"

    LOG_TARGET_COLUMN = "target_log_violations"

    REQUIRED_COLUMNS = [
        "h3_index",
        "week_start",
        "weekly_violations",
        "weekly_unique_vehicles",
        "weekly_repeat_offenders",
        "weekly_unique_devices",
        "weekly_approval_rate",
        "weekly_violations_per_day",
        "active_days",
    ]

    def build(self) -> pd.DataFrame:

        LOG.info("Building forecasting dataset")

        df = self._load_dataset()

        df = self._add_temporal_features(df)

        df = self._add_lag_features(df)

        df = self._add_rolling_features(df)

        df = self._add_growth_features(df)

        df = self._add_target_features(df)

        df = self._validate_dataset(df)

        df = self._select_columns(df)

        LOG.info(
            "Forecast dataset built successfully "
            f"({len(df):,} rows)"
        )

        return df


    # Dataset Loading
    def _load_dataset(self) -> pd.DataFrame:

        input_path = (PROCESSED_DIR/self.INPUT_FILE)

        LOG.info(f"Loading {input_path}")

        df = pd.read_parquet(input_path)

        missing = (set(self.REQUIRED_COLUMNS) - set(df.columns))

        if missing:
            raise ValueError(f"Missing required columns: {sorted(missing)}")

        df = (
            df
            .sort_values(
                ["h3_index","week_start"]
            )
            .reset_index(drop=True)
        )

        return df


    # Temporal Features
    def _add_temporal_features(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        LOG.info("Creating temporal features")

        iso_calendar = (
            df["week_start"]
            .dt.isocalendar()
        )

        df["week_number"] = (
            iso_calendar.week.astype(int)
        )

        df["month"] = (
            df["week_start"]
            .dt.month
            .astype(int)
        )

        df["quarter"] = (
            df["week_start"]
            .dt.quarter
            .astype(int)
        )

        return df


    # Lag Features
    def _add_lag_features(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        LOG.info("Creating lag features")

        grouped = (
            df.groupby("h3_index")
            ["weekly_violations"]
        )

        df["lag_1_week"] = (
            grouped.shift(1)
        )

        df["lag_2_week"] = (
            grouped.shift(2)
        )

        df["lag_3_week"] = (
            grouped.shift(3)
        )

        return df


    # Rolling Statistics
    def _add_rolling_features(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        LOG.info("Creating rolling statistics")

        grouped = (
            df.groupby("h3_index")
            ["weekly_violations"]
        )

        df["rolling_4_week_avg"] = (
            grouped.transform(
                lambda s:
                (
                    s.shift(1)
                     .rolling(window=4,min_periods=1)
                     .mean()
                )
            )
        )

        df["rolling_4_week_std"] = (
            grouped.transform(
                lambda s:
                (
                    s.shift(1)
                     .rolling(window=4,min_periods=2)
                     .std()
                )
            )
        )

        df["rolling_4_week_std"] = (
            df["rolling_4_week_std"]
            .fillna(0.0)
        )

        return df
    


    # Growth Features
    def _add_growth_features(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        LOG.info("Creating growth features")

        df["growth_rate"] = np.where(
            df["lag_2_week"] > 0,
            (df["lag_1_week"] - df["lag_2_week"]) / df["lag_2_week"],
            0.0,
        )

        df["growth_rate"] = (
            df["growth_rate"]
            .replace(
                [np.inf, -np.inf],
                0.0,
            )
            .fillna(0.0)
        )

        return df


    # Target Engineering
    def _add_target_features(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        LOG.info("Creating forecasting targets")

        grouped = (
            df.groupby("h3_index")
            ["weekly_violations"]
        )

        df[self.TARGET_COLUMN] = grouped.shift(-1)

        df[self.LOG_TARGET_COLUMN] = np.log1p(df[self.TARGET_COLUMN])

        return df


    # Validation
    def _validate_dataset(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        LOG.info("Validating forecasting dataset")

        required_features = [
            "lag_1_week",
            "lag_2_week",
            "lag_3_week",
            "rolling_4_week_avg",
            "rolling_4_week_std",
            self.TARGET_COLUMN,
        ]

        df = df.dropna(
            subset=required_features
        ).reset_index(drop=True)

        if df.empty:
            raise ValueError("Forecasting dataset is empty after feature engineering.")

        if (
            df[self.TARGET_COLUMN]
            < 0
        ).any():
            raise ValueError("Negative target values detected.")

        return df


    # Feature Selection
    def _select_columns(
        self,
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        feature_columns = [

           
            # Identity
            "h3_index",
            "week_start",


            # Calendar
            "week_number",
            "month",
            "quarter",


            # Current Week
            # (Lag-0)
            "weekly_violations",


            # Historical Behaviour
            "lag_1_week",
            "lag_2_week",
            "lag_3_week",

            "rolling_4_week_avg",
            "rolling_4_week_std",

            "growth_rate",

            # Operational Context
            "weekly_approved_violations",
            "weekly_unique_vehicles",
            "weekly_repeat_offenders",
            "weekly_unique_devices",

            "weekly_approval_rate",
            "weekly_violations_per_day",

            "active_days",


            # Spatial
            "latitude",
            "longitude",


            # Targets
            self.TARGET_COLUMN,
            self.LOG_TARGET_COLUMN,
        ]

        missing = [
            column
            for column in feature_columns
            if column not in df.columns
        ]

        if missing:
            raise ValueError(f"Missing engineered columns: {missing}")

        return df[
            feature_columns
        ].copy()