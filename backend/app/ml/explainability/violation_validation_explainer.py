"""
ParkOptic - Violation Validation Explainer

Purpose:
    Generate SHAP explainability for the
    Violation Validation Model.
"""

from pathlib import Path

import pandas as pd
import shap
import matplotlib.pyplot as plt

from catboost import CatBoostClassifier

from config import (ML_DIR,DOCS_DIR,ARTIFACTS_DIR)

from utils.logger import LOG


class ViolationValidationExplainer:

    MODEL_NAME = ("violation_validation_model.cbm")

    SAMPLE_SIZE = 5000

    def explain(self):

        LOG.info("Loading model")

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

        model = CatBoostClassifier()

        model.load_model(model_path)

        dataset_path = (ML_DIR/"validation_dataset.parquet")

        df = pd.read_parquet(dataset_path)

        X = df.drop(
            columns=["target"]
        )

        if len(X) > self.SAMPLE_SIZE:

            X = X.sample(
                self.SAMPLE_SIZE,
                random_state=42,
            )

        LOG.info(f"Explaining {len(X):,} rows")

        explainer = shap.TreeExplainer(model)

        shap_values = (explainer.shap_values(X))

        ARTIFACTS_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        summary_path = (ARTIFACTS_DIR/"violation_validation_shap_summary.png")

        plt.figure()

        shap.summary_plot(
            shap_values,
            X,
            show=False,
        )

        plt.tight_layout()

        plt.savefig(
            summary_path,
            bbox_inches="tight",
        )

        plt.close()

        LOG.info(f"Saved summary plot: {summary_path}")

        bar_path = (ARTIFACTS_DIR/"violation_validation_shap_bar.png")

        plt.figure()

        shap.summary_plot(
            shap_values,
            X,
            plot_type="bar",
            show=False,
        )

        plt.tight_layout()

        plt.savefig(
            bar_path,
            bbox_inches="tight",
        )

        plt.close()

        LOG.info(f"Saved bar plot: {bar_path}")

        importance = (
            pd.DataFrame(
                {
                    "feature":
                    X.columns,
                    "importance":
                    abs(shap_values).mean(axis=0)
                }
            )
            .sort_values(
                "importance",
                ascending=False,
            )
        )

        top_features = (
            importance
            .head(10)
        )

        report = f"""
# Violation Validation Explainability Report

## Top Features

{top_features.to_string(index=False)}
"""

        report_path = (DOCS_DIR/"violation_validation_explainability_report.md")

        with open(
            report_path,
            "w",
            encoding="utf-8",
        ) as file:

            file.write(report)

        LOG.info(f"Saved report: {report_path}")

        return importance