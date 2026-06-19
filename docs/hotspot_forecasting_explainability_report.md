
# Hotspot Forecasting Explainability Report

## Model

CatBoost Regressor

## Samples Explained
5,000

## Top 10 Most Important Features

               feature  importance
    rolling_4_week_avg    0.320033
weekly_unique_vehicles    0.106691
           active_days    0.092001
     weekly_violations    0.081196
    rolling_4_week_std    0.071131
 weekly_unique_devices    0.054482
            lag_1_week    0.039947
            lag_2_week    0.021268
            lag_3_week    0.020521
               quarter    0.020126

## Generated Artifacts

- shap_summary.png
- shap_bar.png
- shap_waterfall.png
- shap_values.parquet
- feature_importance.csv
