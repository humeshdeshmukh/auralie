from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

# Request Models
class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    gender: Optional[Gender] = None
    date_of_birth: Optional[datetime] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=50)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    gender: Optional[Gender] = None
    date_of_birth: Optional[datetime] = None

# Response Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600  # 1 hour in seconds

class UserInDB(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    email_verified: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    gender: Optional[Gender] = None
    date_of_birth: Optional[datetime] = None

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class UserResponse(UserInDB):
    """Response model for user data"""
    pass

# Utility Models
class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    email: Optional[str] = None
