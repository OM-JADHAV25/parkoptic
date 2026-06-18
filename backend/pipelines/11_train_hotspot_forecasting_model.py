"""
ParkOptic - Hotspot Forecasting Training Pipeline
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

sys.path.append(str(ROOT))

from utils.logger import LOG

from app.ml.training.hotspot_forecasting_trainer import (HotspotForecastingTrainer,)


def main():

    LOG.info("=" * 70)
    LOG.info("ParkOptic Hotspot Forecasting Training Pipeline")
    LOG.info("=" * 70)

    trainer = HotspotForecastingTrainer()

    trainer.train()

    LOG.info("=" * 70)
    LOG.info("Hotspot Forecasting Training Completed Successfully")
    LOG.info("=" * 70)

if __name__ == "__main__":
    main()