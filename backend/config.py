from pathlib import Path


# Project Paths
PROJECT_ROOT = Path(__file__).resolve().parent

DATA_DIR = (PROJECT_ROOT/ "data")

RAW_DIR = (DATA_DIR/ "raw")

PROCESSED_DIR = (DATA_DIR/ "processed")

ML_DIR = (DATA_DIR/ "ml")

DOCS_DIR = (PROJECT_ROOT.parent/ "docs")


# Raw Dataset
RAW_DATA_PATH = (RAW_DIR/ "violations.csv")

# Artifacts Path
ARTIFACTS_DIR = (PROJECT_ROOT/"artifacts")