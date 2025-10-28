import os
import json
import joblib
import numpy as np
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
import logging
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import pandas as pd

logger = logging.getLogger(__name__)

class PredictService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.metadata = {}
        self.model_path = Path("aiml/models/cycle_predictor.joblib")
        self.scaler_path = Path("aiml/models/scaler.joblib")
        self.metadata_path = Path("aiml/models/metadata.json")
        self._ensure_model_dirs()
        self._load_model()
    
    def _ensure_model_dirs(self):
        """Ensure model directories exist"""
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
    
    def _load_model(self):
        """Load model, scaler, and metadata if they exist"""
        try:
            if self.model_path.exists():
                self.model = joblib.load(self.model_path)
            if self.scaler_path.exists():
                self.scaler = joblib.load(self.scaler_path)
            if self.metadata_path.exists():
                with open(self.metadata_path, 'r') as f:
                    self.metadata = json.load(f)
        except Exception as e:
            logger.warning(f"Error loading model: {e}")
            self.model = None
            self.scaler = None
    
    def _save_model(self):
        """Save model, scaler, and metadata"""
        if self.model is not None:
            joblib.dump(self.model, self.model_path)
        if self.scaler is not None:
            joblib.dump(self.scaler, self.scaler_path)
        with open(self.metadata_path, 'w') as f:
            json.dump(self.metadata, f)
    
    def preprocess_data(self, cycles: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray, dict]:
        """
        Preprocess cycle data into features and targets
        Returns: (X, y, feature_names)
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
        
        # Add rolling statistics
        cycle_lengths = []
        period_lengths = []
        
        for i in range(1, len(cycles)):
            prev_cycle = cycles[i-1]
            curr_cycle = cycles[i]
            
            # Calculate cycle length (days between starts)
            cycle_length = (curr_cycle['start_date'] - prev_cycle['start_date']).days
            cycle_lengths.append(cycle_length)
            
            # Get period length
            period_length = prev_cycle.get('period_length', 5)  # Default to 5 days if not provided
            period_lengths.append(period_length)
            
            # Calculate rolling statistics
            if len(cycle_lengths) >= 2:
                avg_cycle = sum(cycle_lengths) / len(cycle_lengths)
                avg_period = sum(period_lengths) / len(period_lengths)
                cycle_std = np.std(cycle_lengths)
                period_std = np.std(period_lengths)
                
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
    
    def train(self, cycles: List[Dict[str, Any]]) -> dict:
        """Train a new model with the provided cycle data"""
        try:
            X, y, feature_names = self.preprocess_data(cycles)
            
            # Initialize and train model
            self.model = RandomForestRegressor(
                n_estimators=100,
                random_state=42,
                n_jobs=-1
            )
            
            # Train-test split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Scale features
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate
            train_score = self.model.score(X_train_scaled, y_train)
            test_score = self.model.score(X_test_scaled, y_test)
            
            # Save model and metadata
            self.metadata.update({
                'last_trained': datetime.now().isoformat(),
                'train_score': float(train_score),
                'test_score': float(test_score),
                'n_samples': len(X),
                'feature_importances': dict(zip(feature_names, self.model.feature_importances_.tolist()))
            })
            
            self._save_model()
            
            return {
                'train_score': train_score,
                'test_score': test_score,
                'n_samples': len(X)
            }
            
        except Exception as e:
            logger.error(f"Training failed: {e}", exc_info=True)
            raise
    
    def predict(self, cycles: List[Dict[str, Any]]) -> dict:
        """Predict next cycle and fertile window"""
        if not self.model or not self.scaler:
            # Fallback to simple average if no model is trained
            return self._fallback_prediction(cycles)
        
        try:
            # Prepare features for prediction
            X, _, _ = self.preprocess_data(cycles)
            
            if X.size == 0:
                return self._fallback_prediction(cycles)
                
            # Use the most recent data point for prediction
            X_recent = X[-1:]
            X_scaled = self.scaler.transform(X_recent)
            
            # Predict next cycle length
            next_cycle_length = max(21, min(45, self.model.predict(X_scaled)[0]))  # Constrain to reasonable range
            
            # Get most recent cycle
            last_cycle = max(cycles, key=lambda x: x['start_date'])
            last_date = last_cycle['start_date']
            
            # Calculate next period date
            next_period_date = last_date + timedelta(days=next_cycle_length)
            
            # Calculate fertile window (5 days before and 1 day after ovulation)
            # Ovulation typically occurs ~14 days before next period
            ovulation_day = next_period_date - timedelta(days=14)
            fertile_start = ovulation_day - timedelta(days=5)
            fertile_end = ovulation_day + timedelta(days=1)
            
            return {
                'next_period_date': next_period_date.isoformat(),
                'cycle_length': next_cycle_length,
                'fertile_window': {
                    'start': fertile_start.isoformat(),
                    'end': fertile_end.isoformat(),
                    'ovulation_day': ovulation_day.isoformat()
                },
                'confidence': 'high' if len(cycles) >= 3 else 'medium' if len(cycles) >= 1 else 'low',
                'model_used': 'ml_model',
                'last_cycle_date': last_date.isoformat()
            }
            
        except Exception as e:
            logger.warning(f"Prediction failed, falling back to simple average: {e}")
            return self._fallback_prediction(cycles)
    
    def _fallback_prediction(self, cycles: List[Dict[str, Any]]) -> dict:
        """Fallback prediction using simple average when ML model is not available"""
        if not cycles:
            return {
                'next_period_date': (date.today() + timedelta(days=28)).isoformat(),
                'cycle_length': 28,
                'fertile_window': {
                    'start': (date.today() + timedelta(days=9)).isoformat(),
                    'end': (date.today() + timedelta(days=15)).isoformat(),
                    'ovulation_day': (date.today() + timedelta(days=14)).isoformat()
                },
                'confidence': 'low',
                'model_used': 'fallback',
                'message': 'Using fallback prediction - not enough data for ML model'
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
        ovulation_day = next_period - timedelta(days=14)
        
        return {
            'next_period_date': next_period.isoformat(),
            'cycle_length': avg_cycle_length,
            'fertile_window': {
                'start': (ovulation_day - timedelta(days=5)).isoformat(),
                'end': (ovulation_day + timedelta(days=1)).isoformat(),
                'ovulation_day': ovulation_day.isoformat()
            },
            'confidence': 'medium' if cycle_lengths else 'low',
            'model_used': 'average',
            'last_cycle_date': last_cycle['start_date'].isoformat(),
            'message': 'Using fallback prediction - not enough data for ML model' if not cycle_lengths else None
        }
