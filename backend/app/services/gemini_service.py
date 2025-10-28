"""
Gemini AI service for cycle prediction.
Uses Google's Gemini API to provide more accurate and contextual cycle predictions.
"""
import os
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

import google.generativeai as genai
from ..core.config import settings

logger = logging.getLogger(__name__)

class GeminiPredictionService:
    """Service for making predictions using Google's Gemini AI."""
    
    def __init__(self):
        """Initialize the Gemini prediction service."""
        self.client = None
        self.model = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the Gemini client with API key."""
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set. Gemini predictions will be disabled.")
            return
        
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME)
            logger.info("Gemini AI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            self.model = None
    
    def format_cycle_data(self, cycles: List[Dict[str, Any]]) -> str:
        """Format cycle data into a human-readable string for the AI prompt."""
        if not cycles:
            return "No cycle history available."
            
        formatted = []
        for i, cycle in enumerate(cycles[-5:], 1):  # Use up to 5 most recent cycles
            start_date = cycle['start_date'].strftime('%Y-%m-%d') if hasattr(cycle['start_date'], 'strftime') else cycle['start_date']
            end_date = cycle.get('end_date', 'N/A')
            if end_date and hasattr(end_date, 'strftime'):
                end_date = end_date.strftime('%Y-%m-%d')
                
            cycle_info = f"Cycle {i}: Started {start_date}"
            if end_date and end_date != 'N/A':
                cycle_info += f", Ended {end_date}"
            
            if 'period_length' in cycle:
                cycle_info += f", Period length: {cycle['period_length']} days"
                
            if 'symptoms' in cycle and cycle['symptoms']:
                cycle_info += f", Symptoms: {', '.join(str(s) for s in cycle['symptoms'])}"
                
            formatted.append(cycle_info)
            
        return "\n".join(formatted)
    
    async def predict_next_cycle(self, cycles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Predict the next cycle using Gemini AI.
        
        Args:
            cycles: List of previous cycles with start_date and other details
            
        Returns:
            Dictionary with prediction results
        """
        if not self.model:
            logger.warning("Gemini model not available")
            return {
                'status': 'error',
                'message': 'Gemini AI service not available',
                'model_used': 'none'
            }
        
        try:
            # Format the prompt
            prompt = """You are a helpful assistant that predicts menstrual cycles. 
Based on the following cycle history, predict the next period start date, 
fertile window, and ovulation day. Provide the response in JSON format with 
these fields: next_period_date (YYYY-MM-DD), fertile_window_start (YYYY-MM-DD), 
fertile_window_end (YYYY-MM-DD), ovulation_day (YYYY-MM-DD), and confidence (high/medium/low).

Cycle History:
{cycle_history}

Current Date: {current_date}

Respond with only the JSON object, no other text or markdown formatting.""".format(
                cycle_history=self.format_cycle_data(cycles),
                current_date=datetime.now().strftime('%Y-%m-%d')
            )
            
            # Make the API call
            response = await self.model.generate_content_async(prompt)
            
            # Parse the response
            try:
                # Extract JSON from the response
                response_text = response.text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text[7:-3].strip()
                elif response_text.startswith('```'):
                    response_text = response_text[3:-3].strip()
                    
                prediction = json.loads(response_text)
                
                return {
                    'status': 'success',
                    'prediction': {
                        'next_period_date': prediction['next_period_date'],
                        'fertile_window': {
                            'start': prediction['fertile_window_start'],
                            'end': prediction['fertile_window_end'],
                            'ovulation_day': prediction['ovulation_day']
                        },
                        'confidence': prediction.get('confidence', 'medium'),
                        'model_used': 'gemini_ai',
                        'last_cycle_date': cycles[-1]['start_date'].isoformat() if cycles else None
                    },
                    'metadata': {
                        'model': settings.GEMINI_MODEL_NAME,
                        'timestamp': datetime.now().isoformat()
                    }
                }
                
            except (json.JSONDecodeError, KeyError) as e:
                logger.error(f"Failed to parse Gemini response: {e}")
                raise ValueError(f"Invalid response format from Gemini: {response.text}")
                
        except Exception as e:
            logger.error(f"Gemini prediction failed: {e}", exc_info=True)
            return {
                'status': 'error',
                'message': str(e),
                'model_used': 'gemini_ai'
            }

# Singleton instance
gemini_service = GeminiPredictionService()
