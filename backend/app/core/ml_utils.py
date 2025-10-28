"""
Utility functions for machine learning operations.
"""
import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

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
        raise

def calculate_cycle_metrics(cycles: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate cycle statistics from cycle data.
    
    Args:
        cycles: List of cycle dictionaries with 'start_date' and 'period_length' keys
        
    Returns:
        Dictionary with cycle statistics
    """
    if not cycles or len(cycles) < 2:
        return {
            'avg_cycle_length': 28,
            'avg_period_length': 5,
            'cycle_std': 0,
            'period_std': 0,
            'cycle_range': (21, 35),
            'period_range': (3, 7),
            'cycle_count': 0
        }
    
    # Sort cycles by start date
    sorted_cycles = sorted(cycles, key=lambda x: x['start_date'])
    
    # Calculate cycle lengths (days between starts)
    cycle_lengths = []
    for i in range(1, len(sorted_cycles)):
        prev_date = sorted_cycles[i-1]['start_date']
        curr_date = sorted_cycles[i]['start_date']
        cycle_length = (curr_date - prev_date).days
        cycle_lengths.append(cycle_length)
    
    # Get period lengths
    period_lengths = [c.get('period_length', 5) for c in sorted_cycles[:-1]]  # Default to 5 days if not provided
    
    # Calculate statistics
    stats = {
        'avg_cycle_length': float(np.mean(cycle_lengths)) if cycle_lengths else 28,
        'avg_period_length': float(np.mean(period_lengths)) if period_lengths else 5,
        'cycle_std': float(np.std(cycle_lengths)) if len(cycle_lengths) > 1 else 0,
        'period_std': float(np.std(period_lengths)) if len(period_lengths) > 1 else 0,
        'cycle_range': (int(min(cycle_lengths)) if cycle_lengths else 21, 
                       int(max(cycle_lengths)) if cycle_lengths else 35),
        'period_range': (int(min(period_lengths)) if period_lengths else 3, 
                        int(max(period_lengths)) if period_lengths else 7),
        'cycle_count': len(cycle_lengths)
    }
    
    return stats

def predict_fertile_window(
    next_period_date: Union[str, datetime], 
    cycle_length: Optional[int] = None
) -> Dict[str, str]:
    """
    Calculate fertile window based on next period date.
    
    Args:
        next_period_date: Expected next period date (string or datetime)
        cycle_length: Optional cycle length in days
        
    Returns:
        Dictionary with fertile window dates
    """
    if isinstance(next_period_date, str):
        next_period_date = datetime.fromisoformat(next_period_date)
    
    # Default to 28-day cycle if not provided
    cycle_length = cycle_length or 28
    
    # Ovulation typically occurs ~14 days before next period
    ovulation_day = next_period_date - timedelta(days=14)
    
    # Fertile window is typically 5 days before ovulation to 1 day after
    fertile_start = ovulation_day - timedelta(days=5)
    fertile_end = ovulation_day + timedelta(days=1)
    
    return {
        'ovulation_day': ovulation_day.isoformat(),
        'fertile_window_start': fertile_start.isoformat(),
        'fertile_window_end': fertile_end.isoformat(),
        'next_period': next_period_date.isoformat(),
        'cycle_length': cycle_length
    }
