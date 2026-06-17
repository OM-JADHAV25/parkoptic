"""
ParkOptic - Violation Validation Trainer

Purpose:
    Train a CatBoost classifier to predict whether a parking violation will be APPROVED or REJECTED / DUPLICATE.

Inputs:
    validation_dataset.parquet

Outputs:
    violation_validation_model.cbm
    validation_predictions.parquet
    validation_classifier_report.md
"""

from pathlib import Path

import pandas as pd

from catboost import CatBoostClassifier

from sklearn.model_selection import train_test_split

from sklearn.metrics import (accuracy_score,precision_score,recall_score,f1_score,roc_auc_score,confusion_matrix,)

from config import (ML_DIR,DOCS_DIR,)

from utils.logger import LOG


class ViolationValidationTrainer:

    MODEL_NAME = ("violation_validation_model.cbm")

    CATEGORICAL_FEATURES = [
        "violation_type",
        "final_vehicle_type",
        "police_station",
        "junction_name",
        "device_id",
        "weekday",
        "peak_period",
    ]

    TARGET_COLUMN = "target"

    def train(self) -> dict:

        LOG.info("Loading validation dataset")

        dataset_path = ( ML_DIR/"validation_dataset.parquet")

        if not dataset_path.exists():

            raise FileNotFoundError(f"Dataset not found: {dataset_path}")

        df = pd.read_parquet(dataset_path)

        X = df.drop(columns=[self.TARGET_COLUMN])

        y = df[self.TARGET_COLUMN]

        LOG.info(f"Dataset loaded: {len(df):,} rows")

        X_train, X_test, y_train, y_test = (
            train_test_split(
                X,
                y,
                test_size=0.20,
                random_state=42,
                stratify=y,
            )
        )

        LOG.info(f"Train rows: {len(X_train):,}")

        LOG.info(f"Test rows: {len(X_test):,}")

        model = CatBoostClassifier(
            iterations=1000,
            depth=8,
            learning_rate=0.03,
            loss_function="Logloss",
            eval_metric="AUC",
            random_seed=42,
            verbose=100,
        )

        LOG.info("Training CatBoost model")

        model.fit(
            X_train,
            y_train,
            cat_features=
            self.CATEGORICAL_FEATURES,
            eval_set=(X_test,y_test),
            use_best_model=True,
        )

        LOG.info("Model training completed")

        predictions = (model.predict(X_test))

        probabilities = (model.predict_proba(X_test)[:, 1])

        accuracy = (
            accuracy_score(y_test,predictions)
        )

        precision = (
            precision_score(y_test,predictions)
        )

        recall = (
            recall_score(y_test,predictions)
        )

        f1 = (
            f1_score(y_test,predictions)
        )

        roc_auc = (
            roc_auc_score(y_test,probabilities)
        )

        confusion = (
            confusion_matrix(y_test,predictions)
        )

        metrics = {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "roc_auc": roc_auc,
        }

        model_dir = (
            Path(__file__)
            .resolve()
            .parent
            .parent
            /
            "models"
        )

        model_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        model_path = (model_dir/self.MODEL_NAME)

        model.save_model(model_path)

        LOG.info(f"Saved model to {model_path}")

        predictions_df = (X_test.copy())

        predictions_df["actual"] = y_test.values

        predictions_df["prediction"] = predictions

        predictions_df["approval_probability"] = probabilities

        predictions_path = (ML_DIR/"validation_predictions.parquet")

        predictions_df.to_parquet(
            predictions_path,
            index=False,
        )

        LOG.info(f"Saved predictions to {predictions_path}")

        DOCS_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        report = f"""
# Violation Validation Model Report

## Dataset

Train Rows: {len(X_train):,}

Test Rows: {len(X_test):,}

## Metrics

Accuracy: {accuracy:.4f}

Precision: {precision:.4f}

Recall: {recall:.4f}

F1 Score: {f1:.4f}

ROC-AUC: {roc_auc:.4f}

## Confusion Matrix

{confusion}
"""

        report_path = (DOCS_DIR/"validation_classifier_report.md")

        with open(
            report_path,
            "w",
            encoding="utf-8",
        ) as file:

            file.write(report)

        LOG.info(f"Saved report to {report_path}")

        return metrics