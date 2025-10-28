from datetime import date, datetime
from typing import List, Dict, Any, Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, validator
from pydantic.types import conint

from ....core.security import get_current_user
from ....services.firebase_ai_service import firebase_ai
from ....core.logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Request/Response Models
class CycleData(BaseModel):
    """Cycle data model for API requests."""
    start_date: date
    period_length: conint(ge=1, le=14) = 5
    symptoms: Optional[List[str]] = []
    mood: Optional[str] = None
    flow: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "start_date": "2023-01-01",
                "period_length": 5,
                "symptoms": ["cramps", "headache"],
                "mood": "normal",
                "flow": "medium",
                "notes": "Normal flow, mild cramps"
            }
        }

class PredictionResponse(BaseModel):
    """Prediction response model."""
    status: str
    prediction: Dict[str, Any]
    metadata: Dict[str, Any]

class TrainingResponse(BaseModel):
    """Training response model."""
    status: str
    message: str
    metrics: Dict[str, Any]
    user_id: str

@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict next cycle",
    response_description="Prediction results including next period date and fertile window"
)
async def predict_cycle(
    cycles: List[CycleData],
    current_user: dict = Depends(get_current_user)
):
    """
    Predict the next menstrual cycle and fertile window using Firebase AI.
    
    - **cycles**: List of historical cycle data
    - Returns: Prediction including next period date and fertile window
    """
    try:
        # Convert Pydantic models to dicts for processing
        cycle_dicts = [cycle.dict() for cycle in cycles]
        
        # Make prediction using Firebase AI service
        result = await firebase_ai.predict_next_cycle(
            user_id=current_user['uid'],
            cycles=cycle_dicts
        )
        
        # Log the prediction
        logger.info(f"Prediction made for user {current_user['uid']} using {result['metadata']['model']}")
        
        return {
            "status": "success",
            "prediction": {
                "next_period_date": result["prediction"].get("next_period_date"),
                "fertile_window": result["prediction"].get("fertile_window", {}),
                "confidence": result["prediction"].get("confidence", "medium"),
                "model_used": result["metadata"].get("model", "fallback"),
                "notes": result["prediction"].get("notes", "")
            },
            "metadata": {
                "user_id": current_user['uid'],
                "prediction_date": datetime.utcnow().isoformat(),
                "cycles_used": len(cycles),
                "model": result["metadata"].get("model", "fallback")
            }
        }
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to make prediction: {str(e)}"
        )

@router.post(
    "/train",
    response_model=TrainingResponse,
    status_code=status.HTTP_200_OK,
    summary="Train prediction model",
    response_description="Training results and model metrics",
    deprecated=True
)
async def train_model(
    cycles: List[CycleData],
    current_user: dict = Depends(get_current_user)
):
    """
    This endpoint is deprecated. The system now uses Firebase AI for predictions.
    
    - **cycles**: List of historical cycle data (not used in current implementation)
    - Returns: Information about the deprecation
    """
    return {
        "status": "success",
        "message": "The training endpoint is deprecated. The system now uses Firebase AI for predictions.",
        "metrics": {},
        "user_id": current_user['uid']
    }
