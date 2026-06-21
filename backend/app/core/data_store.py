"""
ParkOptic in-memory data store.

Loads generated intelligence datasets once during FastAPI startup and
serves them from memory for read-only API responses.
"""

from __future__ import annotations

import math
from datetime import date, datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from app.core.settings import settings
from utils.logger import LOG


class DataStore:
    """Singleton in-memory data store."""

    def __init__(self) -> None:
        self.hotspot_cache: dict[str, dict[str, Any]] = {}
        self.datasets: dict[str, pd.DataFrame] = {}
        self.dataset_paths: dict[str, Path] = {}
        self.is_loaded: bool = False
        self.load_timestamp: datetime | None = None

    def load(self) -> None:
        """Load all configured datasets into memory."""

        if self.is_loaded:
            LOG.info("Datasets already loaded. Skipping.")
            return

        LOG.info("Loading datasets into memory...")
        self.load_timestamp = datetime.now()

        dataset_map = {
            "tdpi": settings.PROCESSED_DIR / settings.TDPI_FILE,
            "visibility": settings.PROCESSED_DIR / settings.VISIBILITY_FILE,
            "forecast": settings.PROCESSED_DIR / settings.FORECAST_FILE,
            "patrol": settings.PROCESSED_DIR / settings.PATROL_FILE,
            "deployment": settings.PROCESSED_DIR / settings.DEPLOYMENT_FILE,
            "validation": settings.ML_DIR / settings.VALIDATION_FILE,
            "temporal": settings.PROCESSED_DIR / settings.TEMPORAL_FILE,
        }

        for name, path in dataset_map.items():
            self.dataset_paths[name] = path
            self.datasets[name] = self._load_parquet(path)

        self._build_hotspot_cache()
        self.is_loaded = True

        LOG.info("All datasets successfully loaded.")

    def get(self, dataset: str) -> pd.DataFrame:
        """Retrieve a loaded dataset by name."""

        if dataset not in self.datasets:
            raise KeyError(f"Dataset '{dataset}' not loaded.")

        return self.datasets[dataset]

    def reload(self) -> None:
        """Reload all datasets from disk."""

        LOG.info("Reloading datasets...")
        self.datasets.clear()
        self.hotspot_cache.clear()
        self.dataset_paths.clear()
        self.is_loaded = False
        self.load_timestamp = None
        self.load()

    def info(self) -> dict[str, dict[str, Any]]:
        metadata: dict[str, dict[str, Any]] = {}

        for name, df in self.datasets.items():
            path = self.dataset_paths.get(name)
            last_modified = None
            if path and path.exists():
                last_modified = datetime.fromtimestamp(path.stat().st_mtime).isoformat()

            metadata[name] = {
                "rows": len(df),
                "columns": len(df.columns),
                "memory_mb": float(round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2)),
                "last_modified": last_modified,
            }

        return metadata

    def records(
        self,
        dataset: str,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        df = self.get(dataset)

        if limit is not None:
            df = df.iloc[offset : offset + limit]
        elif offset:
            df = df.iloc[offset:]

        return self._records(df)

    def find_by_h3(self, dataset: str, h3_index: str) -> dict[str, Any] | None:
        df = self.get(dataset)

        if "h3_index" not in df.columns:
            return None

        result = df.loc[df["h3_index"] == h3_index]

        if result.empty:
            return None

        return self._clean_record(result.iloc[0].to_dict())

    def dataset_summary(self, dataset: str) -> dict[str, Any]:
        df = self.get(dataset)

        return {
            "dataset": dataset,
            "rows": len(df),
            "columns": list(df.columns),
            "memory_mb": float(round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2)),
        }

    def model_status(self) -> dict[str, Any]:
        models = {
            "violation_validation": settings.MODELS_DIR / "violation_validation_model.cbm",
            "hotspot_forecasting": settings.MODELS_DIR / "hotspot_forecasting_model.cbm",
            "forecast_metadata": settings.MODELS_DIR / "forecast_metadata.pkl",
        }

        return {
            name: {
                "path": str(path),
                "exists": path.exists(),
                "size_mb": round(path.stat().st_size / 1024 / 1024, 2) if path.exists() else 0,
            }
            for name, path in models.items()
        }

    @staticmethod
    def _load_parquet(path: Path) -> pd.DataFrame:
        if not path.exists():
            raise FileNotFoundError(f"Dataset not found: {path}")

        LOG.info(f"Loading {path.name}")
        df = pd.read_parquet(path)
        LOG.info(f"{path.name}: {len(df):,} rows")
        return df

    def _build_hotspot_cache(self) -> None:
        """
        Build a unified hotspot cache keyed by H3 index.

        This only joins generated datasets; it does not recompute scores.
        """

        LOG.info("Building hotspot cache...")

        tdpi_df = self.datasets.get("tdpi")

        if tdpi_df is None:
            raise RuntimeError("TDPI dataset must be loaded before building hotspot cache.")

        forecast_lookup = self._lookup_by_h3("forecast")
        deployment_lookup = self._lookup_by_h3("deployment")
        visibility_lookup = self._lookup_by_h3("visibility")
        patrol_lookup = self._lookup_by_h3("patrol")

        self.hotspot_cache.clear()

        for row in self._records(tdpi_df):
            h3_index = row["h3_index"]
            deployment = deployment_lookup.get(h3_index)

            self.hotspot_cache[h3_index] = {
                "h3_index": h3_index,
                "latitude": row.get("latitude"),
                "longitude": row.get("longitude"),
                "tdpi": row,
                "forecast": forecast_lookup.get(h3_index),
                "deployment": deployment,
                "patrol": patrol_lookup.get(h3_index),
                "visibility_gap": visibility_lookup.get(h3_index),
                "validation": None,
            }

        LOG.info(f"Built hotspot cache with {len(self.hotspot_cache):,} hotspots.")

    def _lookup_by_h3(self, dataset: str) -> dict[str, dict[str, Any]]:
        df = self.datasets.get(dataset)

        if df is None or "h3_index" not in df.columns:
            return {}

        deduped = df.drop_duplicates("h3_index").set_index("h3_index")

        return {
            str(index): self._clean_record(record)
            for index, record in deduped.to_dict("index").items()
        }

    @classmethod
    def _records(cls, df: pd.DataFrame) -> list[dict[str, Any]]:
        return [cls._clean_record(record) for record in df.to_dict("records")]

    @classmethod
    def _clean_record(cls, record: dict[str, Any]) -> dict[str, Any]:
        return {key: cls._clean_value(value) for key, value in record.items()}

    @classmethod
    def _clean_value(cls, value: Any) -> Any:
        if value is None:
            return None

        if isinstance(value, float) and math.isnan(value):
            return None

        if isinstance(value, np.generic):
            return cls._clean_value(value.item())

        if isinstance(value, (pd.Timestamp, datetime, date)):
            return value.isoformat()

        if isinstance(value, (list, tuple)):
            return [cls._clean_value(item) for item in value]

        if isinstance(value, dict):
            return {key: cls._clean_value(item) for key, item in value.items()}

        return value


data_store = DataStore()
