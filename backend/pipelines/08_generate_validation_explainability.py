"""
ParkOptic - Validation Explainability Pipeline
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

sys.path.append(str(ROOT))

from utils.logger import LOG

from app.ml.explainability.violation_validation_explainer import (ViolationValidationExplainer,)


def main():

    LOG.info("Starting explainability pipeline")

    explainer = (ViolationValidationExplainer())

    explainer.explain()

    LOG.info("Explainability completed")


if __name__ == "__main__":
    main()