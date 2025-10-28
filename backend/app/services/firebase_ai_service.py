"""
Firebase AI Service for cycle predictions using Gemini AI.
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from google.cloud import firestore

from ..core.config import settings
from .firebase_service import db

logger = logging.getLogger(__name__)

class FirebaseAIService:
    """Service for handling AI predictions using Firebase and Gemini."""
    
    def __init__(self):
        self.client = None
        self.model = None
        self._initialize_gemini()
    
    def _initialize_gemini(self):
        """Initialize the Gemini AI client."""
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not set. Gemini AI will be disabled.")
            return
        
        try:
            # Configure the API with the provided key
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
            # Use the configured model name or fall back to a known working model
            model_name = settings.GEMINI_MODEL_NAME or 'gemini-2.5-flash'
            
            # Initialize the model
            self.model = genai.GenerativeModel(model_name)
            logger.info(f"Gemini AI client initialized with model: {model_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client with model {settings.GEMINI_MODEL_NAME}: {e}")
            logger.info("Falling back to a known working model...")
            try:
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                logger.info("Successfully initialized with fallback model: gemini-2.5-flash")
            except Exception as fallback_error:
                logger.error(f"Failed to initialize with fallback model: {fallback_error}")
                self.model = None
    
    async def predict_next_cycle(
        self, 
        user_id: str,
        cycles: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Predict the next menstrual cycle using Gemini AI.
        
        Args:
            user_id: Firebase user ID
            cycles: List of previous cycles with start_date and other details
            
        Returns:
            Dictionary with prediction results
        """
        if not cycles:
            return self._get_fallback_prediction(user_id, cycles)
        
        try:
            # Try Gemini AI first
            if self.model:
                return await self._predict_with_gemini(user_id, cycles)
                
            # Fallback to simple calculation
            return self._get_fallback_prediction(user_id, cycles)
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}", exc_info=True)
            return self._get_fallback_prediction(user_id, cycles)
    
    async def _predict_with_gemini(
        self,
        user_id: str,
        cycles: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Make prediction using Gemini AI."""
        try:
            # Format the prompt with cycle history
            prompt = self._format_cycle_prompt(cycles)
            
            # Make the API call
            response = await self.model.generate_content_async(prompt)
            
            # Parse the response
            prediction = self._parse_gemini_response(response.text)
            
            # Log the prediction
            await self._log_prediction(user_id, {
                'prediction': prediction,
                'model': 'gemini_ai',
                'timestamp': datetime.utcnow().isoformat()
            })
            
            return {
                'status': 'success',
                'prediction': prediction,
                'metadata': {
                    'model': 'gemini_ai',
                    'timestamp': datetime.utcnow().isoformat(),
                    'confidence': prediction.get('confidence', 'medium')
                }
            }
            
        except Exception as e:
            logger.error(f"Gemini prediction failed: {e}", exc_info=True)
            raise
    
    def _format_cycle_prompt(self, cycles: List[Dict[str, Any]]) -> str:
        """Format cycle data into a prompt for Gemini AI."""
        cycle_history = "\n".join([
            f"Cycle {i+1}: Started {cycle['start_date']}, "
            f"Length: {cycle.get('period_length', '?')} days, "
            f"Symptoms: {', '.join(cycle.get('symptoms', []))}"
            for i, cycle in enumerate(cycles[-5:])  # Use last 5 cycles
        ])
        
        return f"""You are a helpful AI assistant that predicts menstrual cycles. 
Based on the following cycle history, predict the next period start date, 
fertile window, and ovulation day. 

Respond with a JSON object containing these fields:
- next_period_date (YYYY-MM-DD)
- fertile_window_start (YYYY-MM-DD)
- fertile_window_end (YYYY-MM-DD)
- ovulation_day (YYYY-MM-DD)
- confidence (high/medium/low)
- notes (any additional insights or considerations)

Cycle History:
{cycle_history}

Current Date: {datetime.utcnow().strftime('%Y-%m-%d')}

Respond with only the JSON object, no other text or markdown formatting."""
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """Parse the response from Gemini AI."""
        try:
            # Clean up the response
            text = response_text.strip()
            if text.startswith('```json'):
                text = text[7:].strip()
            if text.endswith('```'):
                text = text[:-3].strip()
                
            # Parse JSON
            import json
            return json.loads(text)
            
        except Exception as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            raise ValueError("Invalid response format from Gemini AI")
    
    def _get_fallback_prediction(
        self, 
        user_id: str,
        cycles: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Fallback prediction when AI is not available."""
        if not cycles:
            return {
                'status': 'success',
                'prediction': {
                    'next_period_date': None,
                    'fertile_window': {
                        'start': None,
                        'end': None,
                        'ovulation_day': None
                    },
                    'confidence': 'low',
                    'notes': 'No cycle history available'
                },
                'metadata': {
                    'model': 'fallback',
                    'timestamp': datetime.utcnow().isoformat()
                }
            }
        
        # Simple average-based prediction
        last_cycle = cycles[-1]
        avg_cycle_length = self._calculate_average_cycle_length(cycles)
        
        last_start = last_cycle['start_date']
        if not isinstance(last_start, datetime):
            last_start = datetime.strptime(last_start, '%Y-%m-%d')
            
        next_period = last_start + timedelta(days=avg_cycle_length)
        ovulation_day = next_period - timedelta(days=14)
        fertile_start = ovulation_day - timedelta(days=5)
        fertile_end = ovulation_day + timedelta(days=1)
        
        return {
            'status': 'success',
            'prediction': {
                'next_period_date': next_period.strftime('%Y-%m-%d'),
                'fertile_window': {
                    'start': fertile_start.strftime('%Y-%m-%d'),
                    'end': fertile_end.strftime('%Y-%m-%d'),
                    'ovulation_day': ovulation_day.strftime('%Y-%m-%d')
                },
                'confidence': 'medium',
                'notes': 'Prediction based on average cycle length',
                'average_cycle_length': avg_cycle_length
            },
            'metadata': {
                'model': 'fallback',
                'timestamp': datetime.utcnow().isoformat()
            }
        }
    
    def _calculate_average_cycle_length(self, cycles: List[Dict[str, Any]]) -> float:
        """Calculate average cycle length from historical data."""
        if len(cycles) < 2:
            return 28  # Default cycle length
            
        lengths = []
        for i in range(1, len(cycles)):
            current = cycles[i]['start_date']
            previous = cycles[i-1]['start_date']
            
            if not isinstance(current, datetime):
                current = datetime.strptime(current, '%Y-%m-%d')
            if not isinstance(previous, datetime):
                previous = datetime.strptime(previous, '%Y-%m-%d')
                
            length = (current - previous).days
            if 21 <= length <= 35:  # Reasonable range for cycle length
                lengths.append(length)
        
        return sum(lengths) / len(lengths) if lengths else 28
    
    async def _log_prediction(self, user_id: str, data: Dict[str, Any]) -> None:
        """Log the prediction to Firestore."""
        try:
            doc_ref = db.collection('ai_predictions').document()
            await doc_ref.set({
                'user_id': user_id,
                'created_at': firestore.SERVER_TIMESTAMP,
                **data
            })
        except Exception as e:
            logger.error(f"Failed to log prediction: {e}")

# Singleton instance
firebase_ai = FirebaseAIService()
