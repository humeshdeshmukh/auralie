from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import date, timedelta
from pydantic import BaseModel
from ...core.security import get_current_user
from ...services.cycle_service import CycleService
from ...schemas.cycle import CycleCreate, CycleUpdate, CycleInDB, CyclePrediction

router = APIRouter()

class CycleData(BaseModel):
    start_date: date
    end_date: Optional[date] = None
    flow: str  # 'light', 'medium', 'heavy'
    symptoms: List[str] = []
    mood: Optional[str] = None
    notes: Optional[str] = None

@router.post("/cycles/", response_model=CycleInDB)
async def create_cycle(
    cycle: CycleCreate,
    current_user: dict = Depends(get_current_user),
    service: CycleService = Depends()
):
    """Create a new cycle entry"""
    return await service.create_cycle(user_id=current_user["id"], cycle_data=cycle)

@router.get("/cycles/", response_model=List[CycleInDB])
async def read_cycles(
    skip: int = 0,
    limit: int = 100,
    current_user: dict = Depends(get_current_user),
    service: CycleService = Depends()
):
    """Get list of cycles for the current user"""
    return await service.get_user_cycles(user_id=current_user["id"], skip=skip, limit=limit)

@router.get("/cycles/current", response_model=CycleInDB)
async def get_current_cycle(
    current_user: dict = Depends(get_current_user),
    service: CycleService = Depends()
):
    """Get the current cycle for the user"""
    cycle = await service.get_current_cycle(user_id=current_user["id"])
    if not cycle:
        raise HTTPException(status_code=404, detail="No active cycle found")
    return cycle

@router.get("/cycles/predict", response_model=CyclePrediction)
async def predict_next_cycle(
    current_user: dict = Depends(get_current_user),
    service: CycleService = Depends()
):
    """Predict the next cycle dates"""
    return await service.predict_next_cycle(user_id=current_user["id"])

@router.put("/cycles/{cycle_id}", response_model=CycleInDB)
async def update_cycle(
    cycle_id: int,
    cycle: CycleUpdate,
    current_user: dict = Depends(get_current_user),
    service: CycleService = Depends()
):
    """Update a cycle entry"""
    updated_cycle = await service.update_cycle(
        user_id=current_user["id"],
        cycle_id=cycle_id,
        cycle_data=cycle
    )
    if not updated_cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return updated_cycle

@router.delete("/cycles/{cycle_id}", status_code=204)
async def delete_cycle(
    cycle_id: int,
    current_user: dict = Depends(get_current_user),
    service: CycleService = Depends()
):
    """Delete a cycle entry"""
    success = await service.delete_cycle(user_id=current_user["id"], cycle_id=cycle_id)
    if not success:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return {"status": "success", "message": "Cycle deleted"}
