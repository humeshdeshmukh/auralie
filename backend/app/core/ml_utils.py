"""
Utility functions for machine learning operations.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from .config import settings
from .logging_config import get_logger

logger = get_logger(__name__)

def save_model_artifacts(
    model: Any,
    scaler: Any,
    metadata: Dict[str, Any],
    model_path: Optional[str] = None,
    scaler_path: Optional[str] = None,
    metadata_path: Optional[str] = None
) -> None:
    """
    Save model, scaler, and metadata to disk.
    
    Args:
        model: Trained ML model
        scaler: Fitted scaler
        metadata: Model metadata
        model_path: Path to save the model
        scaler_path: Path to save the scaler
        metadata_path: Path to save the metadata
    """
    try:
        model_path = model_path or settings.cycle_model_path
        scaler_path = scaler_path or settings.cycle_scaler_path
        metadata_path = metadata_path or settings.cycle_metadata_path
        
        # Ensure directories exist
        Path(model_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Save model and scaler
        joblib.dump(model, model_path)
        joblib.dump(scaler, scaler_path)
        
        # Save metadata
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
            
        logger.info(f"Model artifacts saved successfully to {Path(model_path).parent}")
        
    except Exception as e:
        logger.error(f"Error saving model artifacts: {e}", exc_info=True)
        raise

def load_model_artifacts(
    model_path: Optional[str] = None,
    scaler_path: Optional[str] = None,
    metadata_path: Optional[str] = None
) -> Tuple[Any, Any, Dict[str, Any]]:
    """
    Load model, scaler, and metadata from disk.
    
    Args:
        model_path: Path to the saved model
        scaler_path: Path to the saved scaler
        metadata_path: Path to the metadata file
        
    Returns:
        Tuple of (model, scaler, metadata)
    """
    try:
        model_path = model_path or settings.cycle_model_path
        scaler_path = scaler_path or settings.cycle_scaler_path
        metadata_path = metadata_path or settings.cycle_metadata_path
        
        if not all(os.path.exists(p) for p in [model_path, scaler_path, metadata_path]):
            raise FileNotFoundError("One or more model files are missing")
        
        # Load model and scaler
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        
        # Load metadata
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
            
        logger.info("Model artifacts loaded successfully")
        return model, scaler, metadata
        
    except Exception as e:
        logger.error(f"Error loading model artifacts: {e}", exc_info=True)
        return model, scaler, metadata
