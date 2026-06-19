"""
ParkOptic - Hotspot Forecasting Explainer

Purpose:
    Generate SHAP explainability for the Hotspot Forecasting Model.

"""

from pathlib import Path

import pandas as pd
import shap

from catboost import CatBoostRegressor

from config import (PROCESSED_DIR,DOCS_DIR,ARTIFACTS_DIR,)

from utils.logger import LOG


class HotspotForecastingExplainer:

    MODEL_NAME = "hotspot_forecasting_model.cbm"

    SAMPLE_SIZE = 5000

    TARGET_COLUMNS = [
        "target_next_week_violations",
        "target_log_violations",
    ]

    def explain(self):

        LOG.info("Loading Hotspot Forecasting model")

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

        model = CatBoostRegressor()

        model.load_model(model_path)

        dataset_path = (PROCESSED_DIR/"forecasting_dataset.parquet")

        LOG.info(f"Loading {dataset_path}")

        df = pd.read_parquet(dataset_path)

        X = df.drop(
            columns=self.TARGET_COLUMNS,
            errors="ignore",
        )


        # Remove non-feature columns
        drop_columns = ["h3_index","week_start"]

        X = X.drop(
            columns=drop_columns,
            errors="ignore",
        )


        # Sample
        if len(X) > self.SAMPLE_SIZE:
            X = X.sample(
                n=self.SAMPLE_SIZE,
                random_state=42,
            )

        LOG.info(f"Generating SHAP values for {len(X):,} rows")

        explainer = shap.TreeExplainer(model)

        shap_values = explainer.shap_values(X)


        # Artifacts Directory
        output_dir = (ARTIFACTS_DIR/"hotspot_forecasting")

        output_dir.mkdir(
            parents=True,
            exist_ok=True,
        )

        # Save SHAP Values
        shap_df = pd.DataFrame(
            shap_values,
            columns=X.columns,
        )

        shap_output = (output_dir/"shap_values.parquet")

        shap_df.to_parquet(
            shap_output,
            index=False,
        )

        LOG.info(f"Saved SHAP values to {shap_output}")


        # Feature Importance
        importance = (
            pd.DataFrame(
                {
                    "feature": X.columns,
                    "importance": (
                        abs(shap_values)
                        .mean(axis=0)
                    ),
                }
            )
            .sort_values(
                by="importance",
                ascending=False,
            )
            .reset_index(drop=True,)
        )

        importance_output = (output_dir/"feature_importance.csv")

        importance.to_csv(
            importance_output,
            index=False,
        )

        LOG.info(f"Saved feature importance to {importance_output}")





        # SHAP Summary Plot
        import matplotlib.pyplot as plt

        summary_plot_path = (output_dir /"shap_summary.png")

        plt.figure(figsize=(12, 8))

        shap.summary_plot(
            shap_values,
            X,
            show=False,
        )

        plt.tight_layout()

        plt.savefig(
            summary_plot_path,
            dpi=300,
            bbox_inches="tight",
        )

        plt.close()

        LOG.info(f"Saved SHAP summary plot to {summary_plot_path}")



        # SHAP Bar Plot
        bar_plot_path = (output_dir /"shap_bar.png")

        plt.figure(figsize=(10, 8))

        shap.summary_plot(
            shap_values,
            X,
            plot_type="bar",
            show=False,
        )

        plt.tight_layout()

        plt.savefig(
            bar_plot_path,
            dpi=300,
            bbox_inches="tight",
        )

        plt.close()

        LOG.info(f"Saved SHAP bar plot to {bar_plot_path}")


        # SHAP Waterfall Plot
        try:

            waterfall_path = (output_dir/"shap_waterfall.png")

            explanation = shap.Explanation(
                values=shap_values[0],
                base_values=explainer.expected_value,
                data=X.iloc[0],
                feature_names=X.columns,
            )

            plt.figure(figsize=(10, 8))

            shap.plots.waterfall(
                explanation,
                show=False,
            )

            plt.tight_layout()

            plt.savefig(
                waterfall_path,
                dpi=300,
                bbox_inches="tight",
            )

            plt.close()

            LOG.info(f"Saved SHAP waterfall plot to {waterfall_path}")

        except Exception as ex:

            LOG.warning(f"Unable to generate waterfall plot: {ex}")

 

        # Explainability Report
        DOCS_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        top_features = (importance.head(10))



        report = f"""
# Hotspot Forecasting Explainability Report

## Model

CatBoost Regressor

## Samples Explained
{len(X):,}

## Top 10 Most Important Features

{top_features.to_string(index=False)}

## Generated Artifacts

- shap_summary.png
- shap_bar.png
- shap_waterfall.png
- shap_values.parquet
- feature_importance.csv
"""

        report_path = (DOCS_DIR/"hotspot_forecasting_explainability_report.md")

        with open(
            report_path,
            "w",
            encoding="utf-8",
        ) as file:

            file.write(report)

        LOG.info(f"Saved explainability report to {report_path}")

        return importance