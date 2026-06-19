"""
ParkOptic - In-Memory Data Store

Purpose
-------
Load all intelligence datasets once during application startup
and serve them from memory for ultra-fast API responses.

This eliminates repeated disk I/O and provides a single
source of truth for the FastAPI application.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional

import pandas as pd

from app.core.settings import settings
from utils.logger import LOG


class DataStore:
    """
    Singleton in-memory data store.

    Loads all Parquet datasets during FastAPI startup
    and keeps them cached in RAM.
    """

    def __init__(self) -> None:

        self.datasets: Dict[str, pd.DataFrame] = {}

        self.is_loaded: bool = False


    # Public API
    def load(self) -> None:
        """
        Load all configured datasets into memory.
        """

        if self.is_loaded:

            LOG.info("Datasets already loaded. Skipping.")

            return

        LOG.info("Loading datasets into memory...")

        dataset_map = {
            "tdpi": settings.TDPI_FILE,
            "visibility": settings.VISIBILITY_FILE,
            "forecast": settings.FORECAST_FILE,
            "patrol": settings.PATROL_FILE,
            "deployment": settings.DEPLOYMENT_FILE,
            "validation": settings.VALIDATION_FILE,
        }

        for name, filename in dataset_map.items():

            path = (settings.PROCESSED_DIR/filename)

            self.datasets[name] = self._load_parquet(path)

        self.is_loaded = True

        LOG.info("All datasets successfully loaded.")


    # Dataset Access
    def get(
        self,
        dataset: str,
    ) -> pd.DataFrame:
        """
        Retrieve a dataset by name.

        Raises:
            KeyError if dataset is unavailable.
        """

        if dataset not in self.datasets:
            raise KeyError(f"Dataset '{dataset}' not loaded.")

        return self.datasets[dataset]


    # Reload
    def reload(self) -> None:
        """
        Reload all datasets from disk.
        """

        LOG.info("Reloading datasets...")

        self.datasets.clear()

        self.is_loaded = False

        self.load()

   
    # Metadata
    def info(self) -> dict:

        metadata = {}

        for name, df in self.datasets.items():

            metadata[name] = {
                "rows": len(df),
                "columns": len(df.columns),
                "memory_mb": round(
                    df.memory_usage(
                        deep=True
                    ).sum()/ 1024
                    / 1024,
                    2,
                ),
            }

        return metadata


    # Internal Helpers
    @staticmethod
    def _load_parquet(
        path: Path,
    ) -> pd.DataFrame:

        if not path.exists():

            raise FileNotFoundError(f"Dataset not found: {path}")

        LOG.info(f"Loading {path.name}")

        df = pd.read_parquet(path)

        LOG.info(
            f"{path.name}: "
            f"{len(df):,} rows"
        )

        return df



# Global Singleton
data_store = DataStore()