"""
Cycle prediction service using machine learning.
"""
import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional, Tuple, Union
from pathlib import Path
import json

from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

from ..core.config import settings
from ..core.logging_config import get_logger
from ..core.ml_utils import (
    save_model_artifacts,
    load_model_artifacts,
    calculate_cycle_metrics,
    predict_fertile_window
)
from .gemini_service import gemini_service

logger = get_logger(__name__)

class CyclePredictor:
    """
    A class to handle cycle prediction using machine learning.
    """
    
    def __init__(self):
        """Initialize the cycle predictor."""
        self.model = None
        self.scaler = None
        self.metadata = {}
        self._load_model()
    
    def _load_model(self) -> None:
        """Load the model, scaler, and metadata if they exist."""
        try:
            if not settings.CYCLE_PREDICTION_ENABLED:
                logger.warning("Cycle prediction is disabled in settings")
                return
                
            self.model, self.scaler, self.metadata = load_model_artifacts()
            logger.info("Successfully loaded cycle prediction model")
            
        except Exception as e:
            logger.warning(f"Could not load model: {e}")
            self.model = None
            self.scaler = None
            self.metadata = {
                'last_trained': None,
                'training_metrics': {},
                'feature_importances': {},
                'model_type': 'RandomForestRegressor',
                'version': '1.0.0'
            }
    
    def preprocess_data(
        self, 
        cycles: List[Dict[str, Any]]
    ) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """
        Preprocess cycle data into features and targets.
        
        Args:
            cycles: List of cycle dictionaries with 'start_date' and 'period_length' keys
            
        Returns:
            Tuple of (features, targets, feature_names)
        """
        if len(cycles) < 2:
            raise ValueError("At least 2 cycles are required for prediction")
        
        # Sort cycles by date
        cycles = sorted(cycles, key=lambda x: x['start_date'])
        
        # Calculate features
        X, y = [], []
        feature_names = [
            'prev_cycle_length', 'prev_period_length', 
            'avg_cycle_length', 'avg_period_length',
            'cycle_std', 'period_std'
        ]
        
        # Track cycle and period lengths
        cycle_lengths = []
        period_lengths = []
        
        # Generate features for each cycle after the first one
        for i in range(1, len(cycles)):
            prev_cycle = cycles[i-1]
            curr_cycle = cycles[i]
            
            # Calculate cycle length (days between starts)
            cycle_length = (curr_cycle['start_date'] - prev_cycle['start_date']).days
            cycle_lengths.append(cycle_length)
            
            # Get period length (default to 5 days if not provided)
            period_length = prev_cycle.get('period_length', 5)
            period_lengths.append(period_length)
            
            # Calculate rolling statistics if we have enough data
            if len(cycle_lengths) >= 2:
                avg_cycle = sum(cycle_lengths) / len(cycle_lengths)
                avg_period = sum(period_lengths) / len(period_lengths)
                cycle_std = np.std(cycle_lengths) if len(cycle_lengths) > 1 else 0
                period_std = np.std(period_lengths) if len(period_lengths) > 1 else 0
                
                # Create feature vector
                features = [
                    cycle_lengths[-1],  # Most recent cycle length
                    period_lengths[-1],  # Most recent period length
                    avg_cycle,
                    avg_period,
                    cycle_std,
                    period_std
                ]
                
                # Target is the next cycle's length
                target = cycle_length
                
                X.append(features)
                y.append(target)
        
        if not X:
            raise ValueError("Insufficient data to create features")
            
        return np.array(X), np.array(y), feature_names
    
    def train(
        self, 
        cycles: List[Dict[str, Any]],
        save_model: bool = True
    ) -> Dict[str, Any]:
        """
        Train a new model with the provided cycle data.
        
        Args:
            cycles: List of cycle dictionaries
            save_model: Whether to save the trained model to disk
            
        Returns:
            Dictionary with training results and metrics
        """
        logger.info("Starting model training...")
        
        if len(cycles) < settings.MIN_CYCLES_FOR_TRAINING:
            raise ValueError(
                f"At least {settings.MIN_CYCLES_FOR_TRAINING} cycles are required for training, "
                f"got {len(cycles)}"
            )
        
        try:
            # Preprocess data
            X, y, feature_names = self.preprocess_data(cycles)
            
            # Split into train and test sets
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, 
                test_size=settings.MODEL_TRAIN_TEST_SPLIT,
                random_state=settings.MODEL_RANDOM_STATE
            )
            
            # Scale features
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Initialize and train model
            self.model = RandomForestRegressor(
                n_estimators=settings.MODEL_N_ESTIMATORS,
                random_state=settings.MODEL_RANDOM_STATE,
                n_jobs=-1
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            train_score = self.model.score(X_train_scaled, y_train)
            test_score = self.model.score(X_test_scaled, y_test)
            
            # Calculate feature importances
            feature_importances = dict(zip(feature_names, self.model.feature_importances_.tolist()))
            
            # Update metadata
            self.metadata.update({
                'last_trained': datetime.now().isoformat(),
                'training_metrics': {
                    'train_score': float(train_score),
                    'test_score': float(test_score),
                    'n_samples': len(X)
                },
                'feature_importances': feature_importances,
                'model_type': 'RandomForestRegressor',
                'version': '1.0.0',
                'trained_with_samples': len(cycles)
            })
            
            # Save model artifacts
            if save_model:
                save_model_artifacts(
                    model=self.model,
                    scaler=self.scaler,
                    metadata=self.metadata
                )
            
            logger.info(f"Model trained successfully. Train score: {train_score:.3f}, Test score: {test_score:.3f}")
            
            return {
                'status': 'success',
                'train_score': train_score,
                'test_score': test_score,
                'n_samples': len(X),
                'feature_importances': feature_importances
            }
            
        except Exception as e:
            logger.error(f"Error training model: {e}", exc_info=True)
            raise
    
    async def predict(
        self, 
        cycles: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Predict the next cycle and fertile window.
        
        Args:
            cycles: List of cycle dictionaries with 'start_date' and 'period_length' keys
            
        Returns:
            Dictionary with prediction results
        """
        logger.info("Making prediction...")
        
        if not cycles:
            return self._get_fallback_prediction()
            
        try:
            # Try using Gemini AI first if available
            if settings.GEMINI_API_KEY:
                try:
                    gemini_result = await gemini_service.predict_next_cycle(cycles)
                    if gemini_result.get('status') == 'success':
                        logger.info("Successfully got prediction from Gemini AI")
                        return gemini_result
                    else:
                        logger.warning(f"Gemini prediction failed: {gemini_result.get('message')}")
                except Exception as e:
                    logger.error(f"Error calling Gemini service: {e}", exc_info=True)
            
            # Fall back to ML model if Gemini is not available or fails
            cycles_sorted = sorted(cycles, key=lambda x: x['start_date'])
            
            # Use ML model if available and we have enough data
            if self.model and self.scaler and len(cycles_sorted) >= 2:
                # Prepare features for prediction
                X, _, _ = self.preprocess_data(cycles_sorted)
                X_scaled = self.scaler.transform(X[-1:])  # Use most recent data point
                
                # Predict next cycle length
                next_cycle_length = max(21, min(45, self.model.predict(X_scaled)[0]))
                last_cycle = cycles_sorted[-1]
                next_period_date = last_cycle['start_date'] + timedelta(days=next_cycle_length)
                
                # Calculate fertile window (5 days before and 1 day after ovulation)
                # Ovulation typically occurs ~14 days before next period
                fertile_info = predict_fertile_window(
                    next_period_date=next_period_date,
                    cycle_length=next_cycle_length
                )
                
                return {
                    'status': 'success',
                    'prediction': {
                        'next_period_date': next_period_date.isoformat(),
                        'cycle_length': next_cycle_length,
                        'fertile_window': {
                            'start': fertile_info['fertile_window_start'],
                            'end': fertile_info['fertile_window_end'],
                            'ovulation_day': fertile_info['ovulation_day']
                        },
                        'confidence': self._calculate_confidence(len(cycles_sorted)),
                        'model_used': 'ml_model',
                        'last_cycle_date': last_cycle['start_date'].isoformat()
                    },
                    'metadata': {
                        'model_version': self.metadata.get('version', '1.0.0'),
                        'last_trained': self.metadata.get('last_trained')
                    }
                }
            
            # Fallback to simple average if ML model is not available
            return self._get_fallback_prediction(cycles)
            
        except Exception as e:
            logger.warning(f"Prediction failed, falling back to simple average: {e}")
            return self._get_fallback_prediction(cycles)
    
    def _calculate_confidence(self, n_cycles: int) -> str:
        """Calculate confidence level based on number of cycles."""
        if n_cycles >= 6:
            return 'high'
        elif n_cycles >= 3:
            return 'medium'
        else:
            return 'low'
    
    def _get_fallback_prediction(
        self, 
        cycles: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Fallback prediction using simple average when ML model is not available.
        
        Args:
            cycles: Optional list of cycle dictionaries
            
        Returns:
            Dictionary with fallback prediction
        """
        logger.info("Using fallback prediction method")
        
        if not cycles:
            # Default prediction if no cycle data
            next_period = date.today() + timedelta(days=28)
            fertile_info = predict_fertile_window(next_period, 28)
            
            return {
                'status': 'success',
                'prediction': {
                    'next_period_date': next_period.isoformat(),
                    'cycle_length': 28,
                    'fertile_window': {
                        'start': fertile_info['fertile_window_start'],
                        'end': fertile_info['fertile_window_end'],
                        'ovulation_day': fertile_info['ovulation_day']
                    },
                    'confidence': 'low',
                    'model_used': 'fallback',
                    'message': 'Using fallback prediction - not enough data for ML model'
                },
                'metadata': {
                    'model_version': 'fallback',
                    'last_trained': None
                }
            }
        
        # Calculate average cycle length from history
        cycle_lengths = []
        sorted_cycles = sorted(cycles, key=lambda x: x['start_date'])
        
        for i in range(1, len(sorted_cycles)):
            prev = sorted_cycles[i-1]['start_date']
            curr = sorted_cycles[i]['start_date']
            cycle_lengths.append((curr - prev).days)
        
        avg_cycle_length = sum(cycle_lengths) / len(cycle_lengths) if cycle_lengths else 28
        avg_cycle_length = max(21, min(45, avg_cycle_length))  # Constrain to reasonable range
        
        last_cycle = max(cycles, key=lambda x: x['start_date'])
        next_period = last_cycle['start_date'] + timedelta(days=avg_cycle_length)
        
        # Calculate fertile window
        fertile_info = predict_fertile_window(next_period, avg_cycle_length)
        
        return {
            'status': 'success',
            'prediction': {
                'next_period_date': next_period.isoformat(),
                'cycle_length': avg_cycle_length,
                'fertile_window': {
                    'start': fertile_info['fertile_window_start'],
                    'end': fertile_info['fertile_window_end'],
                    'ovulation_day': fertile_info['ovulation_day']
                },
                'confidence': 'medium' if cycle_lengths else 'low',
                'model_used': 'average',
                'last_cycle_date': last_cycle['start_date'].isoformat(),
                'message': 'Using fallback prediction - not enough data for ML model' if not cycle_lengths else None
            },
            'metadata': {
                'model_version': 'fallback',
                'last_trained': None
            }
        }
