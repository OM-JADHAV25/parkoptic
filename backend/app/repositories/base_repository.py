"""
ParkOptic - Base Repository

Provides reusable operations for all in-memory Parquet repositories.
"""

from __future__ import annotations

from typing import Any

import pandas as pd


class BaseRepository:
    """
    Base repository for cached DataFrames.
    """

    def __init__(self, dataframe: pd.DataFrame):

        self._df = dataframe


    # Basic Operations
    def all(self) -> pd.DataFrame:
        """Return complete dataset."""

        return self._df

    def count(self) -> int:
        """Return total records."""

        return len(self._df)

    def columns(self) -> list[str]:
        """Return dataset columns."""

        return list(self._df.columns)


    # Lookup
    def get_by_h3(
        self,
        h3_index: str,
    ) -> dict[str, Any] | None:
        """
        Retrieve a single hotspot.
        """

        result = self._df.loc[
            self._df["h3_index"] == h3_index
        ]

        if result.empty:
            return None

        return result.iloc[0].to_dict()


    # Filtering
    def filter(
        self,
        **filters,
    ) -> pd.DataFrame:
        """
        Filter using equality conditions.

        Example:
            filter(
                hotspot_tier="TIER_1",
                risk_category="HIGH",
            )
        """

        df = self._df

        for column, value in filters.items():

            if (
                value is None
                or column not in df.columns
            ):
                continue

            df = df.loc[
                df[column] == value
            ]

        return df


    # Pagination
    @staticmethod
    def paginate(
        df: pd.DataFrame,
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:

        total = len(df)

        start = (page - 1) * page_size

        end = start + page_size

        items = df.iloc[start:end]

        return {
            "page": page,
            "page_size": page_size,
            "total": total,
            "pages": ((total + page_size - 1) // page_size),
            "items": items.to_dict( orient="records")
        }


    # Sorting
    @staticmethod
    def sort(
        df: pd.DataFrame,
        column: str,
        ascending: bool = False,
    ) -> pd.DataFrame:

        if column not in df.columns:

            return df

        return df.sort_values(
            by=column,
            ascending=ascending,
        )

   
    # Top N
    @staticmethod
    def top(
        df: pd.DataFrame,
        n: int = 10,
    ) -> pd.DataFrame:

        return df.head(n)