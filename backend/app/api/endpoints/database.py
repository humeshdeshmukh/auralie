from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import Any, Dict, Optional

from app.services.firebase_service import realtime_db, auth_service
from app.schemas.user import UserInDB

router = APIRouter()
security = HTTPBearer()

@router.post("/realtime/{path:path}")
async def set_realtime_data(
    path: str,
    data: Dict[str, Any],
    current_user: UserInDB = Depends(auth_service.get_current_user)
):
    """
    Set data at a specific path in Realtime Database.
    The path will be prefixed with the user's UID for security.
    """
    user_path = f"users/{current_user.id}/{path}"
    await realtime_db.set_data(user_path, data)
    return {"message": "Data set successfully", "path": user_path}

@router.get("/realtime/{path:path}")
async def get_realtime_data(
    path: str,
    current_user: UserInDB = Depends(auth_service.get_current_user)
):
    """
    Get data from a specific path in Realtime Database.
    The path will be prefixed with the user's UID for security.
    """
    user_path = f"users/{current_user.id}/{path}"
    data = await realtime_db.get_data(user_path)
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data not found at the specified path"
        )
    return data

@router.patch("/realtime/{path:path}")
async def update_realtime_data(
    path: str,
    updates: Dict[str, Any],
    current_user: UserInDB = Depends(auth_service.get_current_user)
):
    """
    Update specific fields at a path in Realtime Database.
    The path will be prefixed with the user's UID for security.
    """
    user_path = f"users/{current_user.id}/{path}"
    await realtime_db.update_data(user_path, updates)
    return {"message": "Data updated successfully", "path": user_path}

@router.delete("/realtime/{path:path}")
async def delete_realtime_data(
    path: str,
    current_user: UserInDB = Depends(auth_service.get_current_user)
):
    """
    Delete data at a specific path in Realtime Database.
    The path will be prefixed with the user's UID for security.
    """
    user_path = f"users/{current_user.id}/{path}"
    await realtime_db.delete_data(user_path)
    return {"message": "Data deleted successfully", "path": user_path}
