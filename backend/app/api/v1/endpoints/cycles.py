from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ...models.cycle import CycleCreate, CycleUpdate, CycleInDB
from ...services.cycle_service import CycleService
from ...core.security import get_current_user

router = APIRouter()

@router.post("/cycles/", response_model=CycleInDB)
async def create_cycle(cycle: CycleCreate, current_user: dict = Depends(get_current_user)):
    return await CycleService.create_cycle(cycle, current_user["id"])

@router.get("/cycles/", response_model=List[CycleInDB])
async def read_cycles(skip: int = 0, limit: int = 100, current_user: dict = Depends(get_current_user)):
    return await CycleService.get_user_cycles(current_user["id"], skip=skip, limit=limit)

@router.get("/cycles/current", response_model=CycleInDB)
async def read_current_cycle(current_user: dict = Depends(get_current_user)):
    cycle = await CycleService.get_current_cycle(current_user["id"])
    if not cycle:
        raise HTTPException(status_code=404, detail="No active cycle found")
    return cycle

@router.put("/cycles/{cycle_id}", response_model=CycleInDB)
async def update_cycle(cycle_id: str, cycle: CycleUpdate, current_user: dict = Depends(get_current_user)):
    return await CycleService.update_cycle(cycle_id, cycle, current_user["id"])

@router.delete("/cycles/{cycle_id}")
async def delete_cycle(cycle_id: str, current_user: dict = Depends(get_current_user)):
    success = await CycleService.delete_cycle(cycle_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return {"message": "Cycle deleted successfully"}