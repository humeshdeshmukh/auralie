import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from cycle_prediction_model import CyclePredictor
import random

def generate_sample_data(num_cycles=12):
    """Generate realistic sample cycle data."""
    start_date = datetime.now() - timedelta(days=num_cycles * 30)
    cycles = []
    
    # Common symptoms and moods
    symptoms_list = [
        ['cramps', 'headache'],
        ['backache', 'bloating'],
        ['fatigue'],
        ['tender_breasts'],
        ['mood_swings'],
        ['acne'],
        ['cravings'],
        []
    ]
    
    moods = ['happy', 'sad', 'anxious', 'irritable', 'energetic', 'tired']
    flows = ['light', 'medium', 'heavy']
    
    # Generate cycles with some natural variation
    for i in range(num_cycles):
        # Add some randomness to cycle length (25-32 days)
        cycle_length = random.randint(25, 32)
        
        # Skip first iteration for start date
        if cycles:
            start_date = cycles[-1]['start_date'] + timedelta(days=cycle_length)
        
        cycle = {
            'start_date': start_date,
            'end_date': start_date + timedelta(days=random.randint(3, 7)),
            'flow': random.choice(flows),
            'mood': random.choice(moods),
            'symptoms': random.choice(symptoms_list),
            'notes': f"Cycle {i+1} notes"
        }
        cycles.append(cycle)
    
    return cycles

def train_and_save_model():
    """Train model with sample data and save it."""
    try:
        # Generate sample data
        cycles = generate_sample_data(num_cycles=12)
        
        # Initialize predictor
        predictor = CyclePredictor(model_dir='models')
        
        # Train model
        print("Training model with sample data...")
        result = predictor.train(cycles)
        
        if result['status'] == 'success':
            print(f"Model trained successfully!")
            print(f"Training metrics: {json.dumps(result['metrics'], indent=2)}")
            
            # Test prediction
            test_prediction = predictor.predict_next_cycle(cycles[-3:])  # Use last 3 cycles for prediction
            print("\nSample prediction:")
            print(f"Next period: {test_prediction['next_period_date']}")
            print(f"Fertile window: {test_prediction['fertile_window']['start']} to {test_prediction['fertile_window']['end']}")
            print(f"Ovulation day: {test_prediction['fertile_window']['ovulation_day']}")
            print(f"Confidence: {test_prediction['confidence']}")
            
            return True
        else:
            print(f"Training failed: {result.get('message', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"Error training model: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Create models directory if it doesn't exist
    os.makedirs('models', exist_ok=True)
    
    # Train and save model
    train_and_save_model()
