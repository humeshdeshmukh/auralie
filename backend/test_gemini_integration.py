"""
Test script to verify Gemini AI integration.
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.firebase_ai_service import firebase_ai
from app.core.config import settings

async def test_gemini_integration():
    print("Testing Gemini AI Integration...")
    print(f"Using model: {settings.GEMINI_MODEL_NAME}")
    
    # Test data
    test_cycles = [
        {
            "start_date": (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d"),
            "period_length": 5,
            "symptoms": ["cramps", "headache"]
        },
        {
            "start_date": (datetime.now() - timedelta(days=32)).strftime("%Y-%m-%d"),
            "period_length": 5,
            "symptoms": ["cramps"]
        }
    ]
    
    try:
        print("\nMaking prediction with test data...")
        result = await firebase_ai.predict_next_cycle(
            user_id="test_user",
            cycles=test_cycles
        )
        
        print("\nPrediction Result:")
        print(f"Status: {result['status']}")
        
        if result['status'] == 'success':
            pred = result['prediction']
            print(f"\nNext Period: {pred.get('next_period_date')}")
            print(f"Fertile Window: {pred.get('fertile_window', {}).get('start')} to {pred.get('fertile_window', {}).get('end')}")
            print(f"Ovulation Day: {pred.get('fertile_window', {}).get('ovulation_day')}")
            print(f"Confidence: {pred.get('confidence', 'N/A')}")
            print(f"Notes: {pred.get('notes', 'No notes')}")
        
        print(f"\nModel Used: {result['metadata'].get('model', 'N/A')}")
        
    except Exception as e:
        print(f"\nError during prediction: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if not settings.GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY is not set in .env file")
    else:
        asyncio.run(test_gemini_integration())
