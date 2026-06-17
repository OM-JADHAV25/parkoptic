import numpy as np
import pandas as pd


def safe_divide(numerator, denominator):

    return np.where(
        denominator > 0,
        numerator / denominator,
        0,
    )


def log_scale(series: pd.Series):

    max_value = series.max()

    if max_value <= 0:
        return pd.Series(
            0,
            index=series.index,
        )

    return ( np.log1p(series)/np.log1p(max_value)) * 100


def minmax_scale(series: pd.Series):

    min_value = series.min()
    max_value = series.max()

    if min_value == max_value:

        return pd.Series(
            50,
            index=series.index,
        )

    return (
        (series - min_value) / (max_value - min_value)
    ) * 100