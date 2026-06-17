"""
ParkOptic - Violation Validation Training Pipeline
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

sys.path.append(str(ROOT))

from utils.logger import LOG

from app.ml.training.violation_validation_trainer import (ViolationValidationTrainer,)


def main():

    LOG.info(
        "Starting violation validation training pipeline"
    )

    trainer = (ViolationValidationTrainer())

    metrics = (trainer.train())

    LOG.info(f"Training completed: {metrics}")


if __name__ == "__main__":
    main()