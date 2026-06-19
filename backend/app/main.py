"""
ParkOptic API

Application Entry Point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.v1.api import api_router
from app.core.data_store import data_store
from app.core.settings import settings

from utils.logger import LOG


# Application Lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load datasets during startup.

    Runs once when the application starts.
    """

    LOG.info("=" * 60)
    LOG.info("Starting ParkOptic API")
    LOG.info("=" * 60)

    data_store.load()

    info = data_store.info()

    for dataset, metadata in info.items():

        LOG.info(
            f"{dataset:<15}"
            f"{metadata['rows']:,} rows | "
            f"{metadata['memory_mb']} MB"
        )

    LOG.info("Application startup complete.")

    yield

    LOG.info("Shutting down ParkOptic API")



# FastAPI
app = FastAPI(

    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)



# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1024,
)



# Routes
app.include_router(
    api_router,
    prefix=settings.API_PREFIX,
)


# Root Endpoint
@app.get(
    "/",
    tags=["Root"],
)
async def root():

    return {
        "application": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }