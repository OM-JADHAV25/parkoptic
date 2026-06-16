from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent

RAW_DATA_PATH = PROJECT_ROOT / "data" / "raw" / "violations.csv"

PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

DOCS_DIR = PROJECT_ROOT.parent / "docs"