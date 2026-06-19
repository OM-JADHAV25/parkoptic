"""
ParkOptic - Application Settings

Centralized application configuration.

This module provides immutable application settings
used throughout the FastAPI backend.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration."""

    # Application
    APP_NAME: str = "ParkOptic API"

    APP_VERSION: str = "1.0.0"

    API_PREFIX: str = "/api/v1"

    DEBUG: bool = False


    # Project Paths
    PROJECT_ROOT: Path = (
        Path(__file__)
        .resolve()
        .parent
        .parent
        .parent
    )

    DATA_DIR: Path = PROJECT_ROOT / "data"

    PROCESSED_DIR: Path = DATA_DIR / "processed"

    ML_DIR: Path = DATA_DIR / "ml"

    ARTIFACTS_DIR: Path = PROJECT_ROOT / "artifacts"

    DOCS_DIR: Path = PROJECT_ROOT.parent / "docs"

    MODELS_DIR: Path = PROJECT_ROOT / "models"


    # API
    DEFAULT_PAGE_SIZE: int = 50

    MAX_PAGE_SIZE: int = 500


    # CORS
    ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )


    # Data Files
    TDPI_FILE: str = "tdpi_scores.parquet"
    VISIBILITY_FILE: str = "visibility_gap.parquet"
    FORECAST_FILE: str = "forecast_predictions.parquet"
    PATROL_FILE: str = "patrol_recommendations.parquet"
    DEPLOYMENT_FILE: str = "deployment_impact.parquet"
    VALIDATION_FILE: str = "validation_predictions.parquet"


    # Environment
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.

    Using lru_cache ensures settings are
    instantiated only once.
    """
    return Settings()


settings = get_settings()