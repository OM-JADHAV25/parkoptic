from loguru import logger

logger.add(
    "pipeline.log",
    rotation="5 MB",
    retention="10 days",
)

LOG = logger