"""
ParkOptic - Validation Classifier Feature Builder

Purpose:
    Build training dataset for the violation validation classifier.

Inputs:
    cleaned_violations.parquet

Outputs:
    Training-ready DataFrame
"""

from pathlib import Path

import pandas as pd

from config import PROCESSED_DIR


class ValidationFeatureBuilder:
    """
    Builds feature set for the validation classifier.
    """

    VALID_STATUSES = [
        "APPROVED",
        "REJECTED",
        "DUPLICATE",
    ]

    FEATURE_COLUMNS = [
        "violation_type",
        "final_vehicle_type",
        "police_station",
        "junction_name",
        "device_id",
        "weekday",
        "peak_period",
        "hour",
        "latitude",
        "longitude",
        "is_weekend",
    ]

    CATEGORICAL_COLUMNS = [
        "violation_type",
        "final_vehicle_type",
        "police_station",
        "junction_name",
        "device_id",
        "weekday",
        "peak_period",
    ]

    NUMERIC_COLUMNS = [
        "hour",
        "latitude",
        "longitude",
        "is_weekend",
    ]

    TARGET_COLUMN = "target"

    METADATA_COLUMNS = ["violation_id",]

    def build(
        self,
    ) -> tuple[pd.DataFrame, pd.DataFrame]:
        """
        Returns
        -------
        tuple
            (
                training_dataset,
                metadata_dataset
            )
        """

        input_path = (PROCESSED_DIR/"cleaned_violations.parquet")

        if not input_path.exists():

            raise FileNotFoundError(f"Missing input dataset: {input_path}")

        df = pd.read_parquet(input_path)

  
        # Keep Only Labeled Records
        df = df[
            df["validation_status"]
            .isin(self.VALID_STATUSES)
        ].copy()

        if df.empty:

            raise ValueError("No labeled records available.")


        # Create Binary Target
        df[self.TARGET_COLUMN] = (
            df["validation_status"]
            .eq("APPROVED")
            .astype(int)
        )


        # Metadata
        available_metadata = [
            column
            for column in self.METADATA_COLUMNS
            if column in df.columns
        ]

        metadata = (
            df[available_metadata].copy()
            if available_metadata
            else pd.DataFrame(index=df.index)
        )


        # Feature Selection
        missing_columns = [
            column
            for column in self.FEATURE_COLUMNS
            if column not in df.columns
        ]

        if missing_columns:

            raise ValueError(
                f"Missing required columns: "
                f"{missing_columns}"
            )

        dataset = df[
            self.FEATURE_COLUMNS
            +
            [self.TARGET_COLUMN]
        ].copy()


        # Categorical Handling
        for column in self.CATEGORICAL_COLUMNS:

            dataset[column] = (
                dataset[column]
                .astype("string")
                .fillna("UNKNOWN")
            )


        # Numeric Handling
        for column in self.NUMERIC_COLUMNS:

            dataset[column] = (
                pd.to_numeric(
                    dataset[column],
                    errors="coerce",
                )
                .fillna(0)
            )


        # Boolean Normalization
        dataset["is_weekend"] = (
            dataset["is_weekend"]
            .astype(int)
        )


        # Final Validation
        if dataset.empty:

            raise ValueError("Generated dataset is empty.")

        return (dataset,metadata)