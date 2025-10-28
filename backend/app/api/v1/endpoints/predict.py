from datetime import date, datetime
from typing import List, Dict, Any, Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, validator
from pydantic.types import conint

from ....core.security import get_current_user
from ....services.cycle_predictor import CyclePredictor
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
) -> Dict[str, Any]:
    """
    Predict the next menstrual cycle and fertile window based on historical data.
    
    - **cycles**: List of historical cycle data
    - Returns: Prediction including next period date and fertile window
    """
    logger.info(f"Prediction request received for user {current_user['id']}")
    
    try:
        if not cycles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one cycle is required for prediction"
            )
        
        # Convert Pydantic models to dicts
        cycle_dicts = [cycle.dict() for cycle in cycles]
        
        # Get prediction
        predictor = CyclePredictor()
        result = predictor.predict(cycle_dicts)
        
        # Log successful prediction
        logger.info(
            f"Prediction successful for user {current_user['id']}. "
            f"Next period: {result['prediction']['next_period_date']}"
        )
        
        return result
        
    except ValueError as ve:
        logger.warning(f"Validation error in prediction: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your prediction"
        )

@router.post(
    "/train",
    response_model=TrainingResponse,
    status_code=status.HTTP_200_OK,
    summary="Train prediction model",
    response_description="Training results and model metrics"
)
async def train_model(
    cycles: List[CycleData],
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Train or retrain the cycle prediction model with new data.
    
    - **cycles**: List of historical cycle data for training
    - Returns: Training results and model metrics
    """
    logger.info(f"Training request received for user {current_user['id']}")
    
    try:
        if len(cycles) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"At least 3 cycles are required for training, got {len(cycles)}"
            )
        
        # Convert Pydantic models to dicts
        cycle_dicts = [cycle.dict() for cycle in cycles]
        
        # Train the model
        predictor = CyclePredictor()
        training_result = predictor.train(cycle_dicts)
        
        # Log successful training
        logger.info(
            f"Model training successful for user {current_user['id']}. "
            f"Train score: {training_result.get('train_score', 0):.3f}, "
            f"Test score: {training_result.get('test_score', 0):.3f}"
        )
        
        return {
            "status": "success",
            "message": "Model trained successfully",
            "metrics": {
                "train_score": training_result.get("train_score"),
                "test_score": training_result.get("test_score"),
                "n_samples": training_result.get("n_samples"),
                "feature_importances": training_result.get("feature_importances", {})
            },
            "user_id": current_user["id"]
        }
        
    except ValueError as ve:
        logger.warning(f"Validation error in training: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Training error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while training the model"
        )
