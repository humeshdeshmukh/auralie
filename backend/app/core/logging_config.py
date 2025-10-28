import logging
import sys
from pathlib import Path
from typing import Optional
import os

from .config import settings

def setup_logging(
    log_level: Optional[str] = None,
    log_file: Optional[str] = None
) -> None:
    """
    Configure logging for the application.
    
    Args:
        log_level: Logging level (e.g., 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')
        log_file: Path to the log file. If None, logs will only go to stdout.
    """
    log_level = log_level or settings.LOG_LEVEL
    log_format = settings.LOG_FORMAT
    
    # Set up root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create formatter
    formatter = logging.Formatter(log_format)
    
    # Console handler (always add)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # File handler (if log_file is provided)
    if log_file:
        # Ensure log directory exists
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # Set log level for specific loggers
    logging.getLogger("uvicorn").setLevel("WARNING")
    logging.getLogger("uvicorn.access").handlers = []
    logging.getLogger("uvicorn.error").propagate = False
    
    # Set log level for external libraries
    logging.getLogger("matplotlib").setLevel("WARNING")
    logging.getLogger("PIL").setLevel("WARNING")
    logging.getLogger("tensorflow").setLevel("WARNING")
    logging.getLogger("transformers").setLevel("WARNING")


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the given name.
    
    Args:
        name: Name of the logger
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)

# Configure logging when this module is imported
setup_logging(
    log_level=settings.LOG_LEVEL,
    log_file=os.path.join(settings.ML_LOGS_DIR, "app.log")
)

# Create a default logger
logger = get_logger(__name__)
