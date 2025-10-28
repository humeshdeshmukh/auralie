from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.schemas.user import User, UserCreate, UserUpdate
from app.services.user_service import (
    get_users, get_user, create_user, 
    update_user, delete_user
)

router = APIRouter()

@router.get("/", response_model=List[User])
async def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve all users with pagination.
    """
    users = get_users(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=User, status_code=201)
async def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.
    """
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db=db, user=user)

@router.get("/{user_id}", response_model=User)
async def read_user(user_id: int, db: Session = Depends(get_db)):
    """
    Get a specific user by ID.
    """
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=User)
async def update_existing_user(
    user_id: int, user: UserUpdate, db: Session = Depends(get_db)
):
    """
    Update a user's information.
    """
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return update_user(db=db, user_id=user_id, user=user)

@router.delete("/{user_id}", status_code=204)
async def delete_existing_user(user_id: int, db: Session = Depends(get_db)):
    """
    Delete a user.
    """
    db_user = get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    delete_user(db=db, user_id=user_id)
    return {"ok": True}
