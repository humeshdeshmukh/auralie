import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional, Tuple, Union
from pathlib import Path
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, r2_score
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DataProcessor:
    """Handles data preprocessing and feature engineering."""
    
    def __init__(self):
        self.feature_columns = [
            'previous_cycle_length',
            'symptoms_count',
            'has_cramps',
            'has_headache',
            'heavy_flow',
            'month',
            'day_of_week'
        ]
        
    def process_cycles(self, cycles: List[Dict]) -> Tuple[pd.DataFrame, pd.Series]:
        """Process raw cycle data into features and target."""
        if len(cycles) < 2:
            raise ValueError("At least 2 cycles are required for training")
            
        # Sort cycles by date
        cycles = sorted(cycles, key=lambda x: x['start_date'])
        
        features = []
        targets = []
        
        for i in range(1, len(cycles)):
            prev_cycle = cycles[i-1]
            current_cycle = cycles[i]
            
            # Calculate target (cycle length in days)
            cycle_length = (current_cycle['start_date'] - prev_cycle['start_date']).days
            
            # Extract features
            feature_row = {
                'previous_cycle_length': (
                    (prev_cycle['start_date'] - cycles[i-2]['start_date']).days 
                    if i >= 2 else 28
                ),
                'symptoms_count': len(prev_cycle.get('symptoms', [])),
                'has_cramps': 1 if 'cramps' in prev_cycle.get('symptoms', []) else 0,
                'has_headache': 1 if 'headache' in prev_cycle.get('symptoms', []) else 0,
                'heavy_flow': 1 if prev_cycle.get('flow') == 'heavy' else 0,
                'month': prev_cycle['start_date'].month,
                'day_of_week': prev_cycle['start_date'].weekday(),
                'cycle_length': cycle_length  # This will be our target
            }
            
            features.append(feature_row)
            
        # Convert to DataFrame
        df = pd.DataFrame(features)
        
        # Separate features and target
        X = df[self.feature_columns]
        y = df['cycle_length']
        
        return X, y

class CyclePredictor:
    """Main class for cycle prediction using machine learning."""
    
    def __init__(self, model_dir: str = 'models'):
        self.model_dir = Path(model_dir)
        self.model_path = self.model_dir / 'cycle_predictor.joblib'
        self.scaler_path = self.model_dir / 'feature_scaler.joblib'
        self.metadata_path = self.model_dir / 'model_metadata.json'
        
        # Create model directory if it doesn't exist
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize model and scaler
        self.model = None
        self.scaler = StandardScaler()
        self.metadata = {
            'trained_at': None,
            'n_samples': 0,
            'metrics': {},
            'feature_importance': {}
        }
        
        # Load existing model if available
        self._load_model()
    
    def _load_model(self) -> None:
        """Load trained model and scaler if they exist."""
        if self.model_path.exists():
            try:
                self.model = joblib.load(self.model_path)
                logger.info(f"Loaded model from {self.model_path}")
                
                if self.scaler_path.exists():
                    self.scaler = joblib.load(self.scaler_path)
                
                if self.metadata_path.exists():
                    with open(self.metadata_path, 'r') as f:
                        self.metadata = json.load(f)
                        
            except Exception as e:
                logger.error(f"Error loading model: {e}")
                self._init_new_model()
        else:
            self._init_new_model()
    
    def _init_new_model(self) -> None:
        """Initialize a new model."""
        self.model = RandomForestRegressor(
            n_estimators=100,
            random_state=42,
            n_jobs=-1
        )
        logger.info("Initialized new prediction model")

    def train(self, cycles: List[Dict], test_size: float = 0.2) -> Dict:
        """
        Train the prediction model on cycle data.
        
        Args:
            cycles: List of cycle dictionaries with start_date and other features
            test_size: Fraction of data to use for testing
            
        Returns:
            Dictionary with training results and metrics
        """
        try:
            # Process the data
            processor = DataProcessor()
            X, y = processor.process_cycles(cycles)
            
            if len(X) < 5:
                return {
                    'status': 'insufficient_data',
                    'message': f'At least 5 cycles are needed for training, got {len(X)}',
                    'metrics': {}
                }
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate
            train_pred = self.model.predict(X_train_scaled)
            test_pred = self.model.predict(X_test_scaled)
            
            # Calculate metrics
            metrics = {
                'train': {
                    'mae': mean_absolute_error(y_train, train_pred),
                    'r2': r2_score(y_train, train_pred)
                },
                'test': {
                    'mae': mean_absolute_error(y_test, test_pred),
                    'r2': r2_score(y_test, test_pred)
                },
                'n_samples': len(cycles)
            }
            
            # Update metadata
            self.metadata.update({
                'trained_at': datetime.utcnow().isoformat(),
                'n_samples': len(cycles),
                'metrics': metrics,
                'feature_importance': dict(zip(
                    X.columns,
                    self.model.feature_importances_.tolist()
                ))
            })
            
            # Save model and metadata
            self._save_model()
            
            return {
                'status': 'success',
                'metrics': metrics,
                'n_samples': len(cycles)
            }
            
        except Exception as e:
            logger.error(f"Training error: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': str(e),
                'metrics': {}
            }
    
    def predict_next_cycle(self, cycles: List[Dict]) -> Dict:
        """
        Predict the next cycle start date and fertile window.
        
        Args:
            cycles: List of historical cycle data
            
        Returns:
            Dictionary with prediction results
        """
        if not cycles:
            raise ValueError("No cycle data provided")
            
        try:
            # Sort cycles by date
            cycles = sorted(cycles, key=lambda x: x['start_date'])
            last_cycle = cycles[-1]
            
            # Prepare features for prediction
            features = {
                'previous_cycle_length': (
                    (last_cycle['start_date'] - cycles[-2]['start_date']).days 
                    if len(cycles) >= 2 else 28
                ),
                'symptoms_count': len(last_cycle.get('symptoms', [])),
                'has_cramps': 1 if 'cramps' in last_cycle.get('symptoms', []) else 0,
                'has_headache': 1 if 'headache' in last_cycle.get('symptoms', []) else 0,
                'heavy_flow': 1 if last_cycle.get('flow') == 'heavy' else 0,
                'month': last_cycle['start_date'].month,
                'day_of_week': last_cycle['start_date'].weekday()
            }
            
            # Convert to DataFrame and scale
            X = pd.DataFrame([features])
            X_scaled = self.scaler.transform(X)
            
            # Predict next cycle length
            predicted_length = int(round(self.model.predict(X_scaled)[0]))
            
            # Ensure prediction is within reasonable bounds
            predicted_length = max(21, min(35, predicted_length))
            
            # Calculate dates
            last_start = last_cycle['start_date']
            next_period = last_start + timedelta(days=predicted_length)
            fertile_window = self._calculate_fertile_window(next_period, predicted_length)
            
            return {
                'next_period_date': next_period.isoformat(),
                'fertile_window': {
                    'start': fertile_window['start'].isoformat(),
                    'end': fertile_window['end'].isoformat(),
                    'ovulation_day': fertile_window['ovulation_day'].isoformat()
                },
                'predicted_cycle_length': predicted_length,
                'confidence': self._get_confidence_interval(len(cycles)),
                'model_metrics': self.metadata.get('metrics', {})
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}", exc_info=True)
            return self._fallback_prediction(cycles)
    
    def _calculate_fertile_window(self, next_period: date, cycle_length: int) -> Dict[str, date]:
        """Calculate fertile window based on next period date and cycle length."""
        # Assuming luteal phase is 14 days
        ovulation_day = next_period - timedelta(days=14)
        fertile_start = ovulation_day - timedelta(days=5)
        fertile_end = ovulation_day + timedelta(days=1)
        
        return {
            'start': fertile_start,
            'end': fertile_end,
            'ovulation_day': ovulation_day
        }
    
    def _get_confidence_interval(self, n_samples: int) -> str:
        """Get confidence level based on number of samples."""
        if n_samples >= 5:
            return 'high'
        elif n_samples >= 3:
            return 'medium'
        return 'low'
    
    def _fallback_prediction(self, cycles: List[Dict]) -> Dict:
        """Fallback prediction when model prediction fails."""
        cycles = sorted(cycles, key=lambda x: x['start_date'])
        last_cycle = cycles[-1]
        
        # Calculate average cycle length
        if len(cycles) >= 2:
            lengths = [(cycles[i]['start_date'] - cycles[i-1]['start_date']).days 
                      for i in range(1, len(cycles))]
            avg_length = int(round(sum(lengths) / len(lengths)))
            avg_length = max(25, min(35, avg_length))
        else:
            avg_length = last_cycle.get('cycle_length', 28)
        
        # Calculate dates
        last_start = last_cycle['start_date']
        next_period = last_start + timedelta(days=avg_length)
        fertile_window = self._calculate_fertile_window(next_period, avg_length)
        
        return {
            'next_period_date': next_period.isoformat(),
            'fertile_window': {
                'start': fertile_window['start'].isoformat(),
                'end': fertile_window['end'].isoformat(),
                'ovulation_day': fertile_window['ovulation_day'].isoformat()
            },
            'predicted_cycle_length': avg_length,
            'confidence': 'low',
            'model_metrics': {},
            'fallback_used': True
        }
    
    def _save_model(self) -> None:
        """Save model, scaler, and metadata to disk."""
        try:
            # Save model
            joblib.dump(self.model, self.model_path)
            
            # Save scaler
            joblib.dump(self.scaler, self.scaler_path)
            
            # Save metadata
            with open(self.metadata_path, 'w') as f:
                json.dump(self.metadata, f, indent=2)
                
            logger.info(f"Model saved to {self.model_path}")
            
        except Exception as e:
            logger.error(f"Error saving model: {e}", exc_info=True)
            raise

# Example usage
if __name__ == "__main__":
    # Sample data
    data = {
        'start_date': ['2023-01-01', '2023-02-01', '2023-03-05', '2023-04-07'],
        'flow': ['medium', 'heavy', 'light', 'medium'],
        'mood': ['good', 'ok', 'good', 'bad'],
        'symptoms': [['cramps', 'headache'], ['backache'], ['cramps'], []]
    }
    
    # Initialize and train model
    predictor = CyclePredictor()
    accuracy = predictor.train(pd.DataFrame(data))
    print(f"Model trained with accuracy: {accuracy:.2f}")
    
    # Make prediction
    prediction = predictor.predict_next_cycle(pd.DataFrame(data))
    print("\nNext cycle prediction:")
    print(f"- Next period: {prediction['next_period_date']}")
    print(f"- Fertile window: {prediction['fertile_window']['start']} to {prediction['fertile_window']['end']}")
    print(f"- Ovulation day: {prediction['fertile_window']['ovulation_day']}")
