"""
ParkOptic - Hotspot Forecasting Trainer

Purpose:
    Train the hotspot escalation forecasting model using historical
    weekly H3 hotspot observations.


Prediction Target:
    target_log_violations

Evaluation:
    - MAE
    - RMSE
    - R²
    - Baseline Comparison
"""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from catboost import CatBoostRegressor

from sklearn.metrics import (mean_absolute_error,mean_squared_error,r2_score)

from config import (DOCS_DIR, PROCESSED_DIR)

from utils.logger import LOG


class HotspotForecastingTrainer:

    MODEL_NAME = "hotspot_forecasting_model.cbm"

    TARGET_COLUMN = "target_log_violations"

    FEATURE_COLUMNS = [

        # Calendar
        "week_number",
        "month",
        "quarter",

        # Current week (Lag-0)
        "weekly_violations",

        # Historical
        "lag_1_week",
        "lag_2_week",
        "lag_3_week",

        "rolling_4_week_avg",
        "rolling_4_week_std",

        "growth_rate",

        # Operational
        "weekly_approved_violations",
        "weekly_unique_vehicles",
        "weekly_repeat_offenders",
        "weekly_unique_devices",

        "weekly_approval_rate",
        "weekly_violations_per_day",

        "active_days",
    ]

    def __init__(self):

        self.model = None

        self.train_df = None
        self.test_df = None

        self.X_train = None
        self.X_test = None

        self.y_train = None
        self.y_test = None

        self.predictions = None

        self.metrics = {}


    # Load Dataset
    def load_dataset(self):

        LOG.info("Loading forecasting dataset")

        dataset = pd.read_parquet(PROCESSED_DIR / "forecasting_dataset.parquet")

        dataset = dataset.sort_values("week_start").reset_index(drop=True)

        self.dataset = dataset

        LOG.info(f"Loaded {len(dataset):,} rows")


    # Chronological Split
    def chronological_split(self):

        LOG.info("Creating chronological split")

        unique_weeks = (sorted(self.dataset["week_start"].unique()))

        split_index = int(len(unique_weeks) * 0.80)

        train_weeks = unique_weeks[:split_index]

        test_weeks = unique_weeks[split_index:]

        self.train_df = (
            self.dataset[
                self.dataset["week_start"]
                .isin(train_weeks)
            ]
            .copy()
        )

        self.test_df = (
            self.dataset[
                self.dataset["week_start"]
                .isin(test_weeks)
            ]
            .copy()
        )

        self.X_train = self.train_df[self.FEATURE_COLUMNS]

        self.y_train = self.train_df[self.TARGET_COLUMN]

        self.X_test = self.test_df[self.FEATURE_COLUMNS]

        self.y_test = self.test_df[self.TARGET_COLUMN]

        LOG.info(f"Train rows : {len(self.train_df):,}")

        LOG.info(f"Test rows  : {len(self.test_df):,}")


    # Baseline Forecast
    def build_baseline(self):

        LOG.info("Computing persistence baseline")

        baseline = np.log1p(
            self.test_df["weekly_violations"]
        )

        mae = mean_absolute_error(self.y_test,baseline)

        rmse = np.sqrt(mean_squared_error(self.y_test,baseline))

        r2 = r2_score(self.y_test,baseline)

        self.metrics["baseline_mae"] = mae

        self.metrics["baseline_rmse"] = rmse

        self.metrics["baseline_r2"] = r2


    # Train CatBoost
    def train_model(self):

        LOG.info("Training CatBoost Regressor")

        self.model = CatBoostRegressor(

            iterations=900,
            depth=5,
            learning_rate=0.03,
            l2_leaf_reg = 8,
            loss_function="RMSE",
            eval_metric="RMSE",
            random_seed=42,
            od_type="Iter",
            od_wait=40,
            use_best_model=True,
            verbose=100,

        )

        self.model.fit(
            self.X_train,
            self.y_train,
            eval_set=(self.X_test,self.y_test),
        )

        self.predictions = (
            self.model.predict(self.X_test)
        )



    # Evaluate Model
    def evaluate_model(self):

        LOG.info("Evaluating forecasting model")

        mae = mean_absolute_error(self.y_test,self.predictions)

        rmse = np.sqrt(mean_squared_error(self.y_test,self.predictions))

        r2 = r2_score(self.y_test,self.predictions,)

        self.metrics["mae"] = mae
        self.metrics["rmse"] = rmse
        self.metrics["r2"] = r2

        LOG.info(f"MAE : {mae:.4f}")

        LOG.info(f"RMSE : {rmse:.4f}")

        LOG.info(f"R² : {r2:.4f}")


    # Trend Classification
    @staticmethod
    def _trend_label(
        predicted: float,
        rolling_average: float,
    ) -> str:

        if predicted > rolling_average * 1.10:
            return "ESCALATING"

        if predicted < rolling_average * 0.90:
            return "DECLINING"

        return "STABLE"


    # Prediction Export
    def save_predictions(self):

        LOG.info("Saving prediction dataset")

        prediction_df = self.test_df.copy()

        prediction_df["predicted_log_violations"] = self.predictions

        prediction_df["predicted_violations"] = np.expm1(self.predictions).round(2)

        prediction_df["actual_violations"] = np.expm1(self.y_test).round(2)

        prediction_df["absolute_error"] = (
            prediction_df["predicted_violations"] -
            prediction_df["actual_violations"]
        ).abs()

        prediction_df["trend"] = prediction_df.apply(

            lambda row:
            self._trend_label(
                row["predicted_violations"],
                row["rolling_4_week_avg"]
            ),

            axis=1,

        )

        PROCESSED_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )
        
        output_path = (PROCESSED_DIR/"forecast_predictions.parquet")

        prediction_df.to_parquet(
            output_path,
            index=False,
        )

        LOG.info(f"Saved predictions -> {output_path}")


    # Save Model
    def save_model(self):

        LOG.info("Saving forecasting model")

        model_path = (
            Path(__file__)
            .resolve()
            .parent
            .parent
            /
            "models"
            /
            self.MODEL_NAME
        )

        model_path.parent.mkdir(parents=True,exist_ok=True)

        self.model.save_model(model_path)

        metadata = {
            "model_name": "Hotspot Forecasting",
            "algorithm": "CatBoostRegressor",
            "version": "1.0.0",
            "target": self.TARGET_COLUMN,
            "feature_columns": self.FEATURE_COLUMNS,
            "training_rows": len(self.train_df),
            "testing_rows": len(self.test_df),
        }

        joblib.dump(
            metadata,
            model_path.parent /"forecast_metadata.pkl"
        )

        LOG.info(f"Saved model -> {model_path}")


    # Markdown Report
    def save_report(self):

        report = f"""
# Hotspot Forecasting Model Report

## Dataset

Training Rows: {len(self.train_df):,}

Testing Rows: {len(self.test_df):,}

## Baseline

MAE: {self.metrics['baseline_mae']:.4f}

RMSE: {self.metrics['baseline_rmse']:.4f}

R²: {self.metrics['baseline_r2']:.4f}

## CatBoost Forecasting

MAE: {self.metrics['mae']:.4f}

RMSE: {self.metrics['rmse']:.4f}

R²: {self.metrics['r2']:.4f}
"""
        
        DOCS_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )
        
        report_path = (DOCS_DIR/"forecast_model_report.md")

        with open(
            report_path,
            "w",
            encoding="utf-8",

        ) as file:
            file.write(report)

        LOG.info(f"Saved report -> {report_path}")



    def train(self):

        LOG.info("=" * 70)
        LOG.info("Starting Hotspot Forecasting Training")
        LOG.info("=" * 70)

        self.load_dataset()

        self.chronological_split()

        self.build_baseline()

        self.train_model()

        self.evaluate_model()

        self.save_model()

        self.save_predictions()

        self.save_report()

        LOG.info("=" * 70)
        LOG.info("Hotspot Forecasting Training Finished")
        LOG.info("=" * 70)