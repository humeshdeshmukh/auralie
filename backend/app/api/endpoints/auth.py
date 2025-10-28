from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Any, Dict
from datetime import timedelta

from app.schemas.user import UserCreate, UserInDB, Token, UserLogin
from app.services.firebase_service import auth_service, user_service

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def register_user(user_in: UserCreate):
    """
    Register a new user with email and password.
    """
    try:
        # Create user in Firebase Authentication
        auth_user = await auth_service.create_user(
            email=user_in.email,
            password=user_in.password,
            display_name=f"{user_in.first_name} {user_in.last_name}"
        )
        
        # Create user document in Firestore
        user_data = user_in.dict(exclude={'password'})
        user_data.update({
            'uid': auth_user['uid'],
            'email_verified': False,
            'created_at': user_service.collection.document()._data['createdAt']
        })
        
        await user_service.create_document(user_data)
        
        # Get auth token for the new user
        user = auth.get_user(auth_user['uid'])
        token = auth.create_custom_token(user.uid)
        
        return {
            "message": "User created successfully",
            "uid": auth_user['uid'],
            "token": token
        }
        
    except Exception as e:
        # Clean up auth user if Firestore creation fails
        if 'auth_user' in locals():
            try:
                auth.delete_user(auth_user['uid'])
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=Dict[str, Any])
async def login_user(login_data: UserLogin):
    """
    Login user with email and password.
    Returns a Firebase ID token for authentication.
    """
    try:
        # This is a simplified example - in a real app, you would use Firebase Client SDK on the frontend
        # and verify the ID token on the backend
        user = auth.get_user_by_email(login_data.email)
        
        # Here you would verify the password, but Firebase Admin SDK doesn't have this method
        # In a real app, this would be handled by Firebase Client SDK on the frontend
        
        # Create a custom token that can be used on the client to sign in
        token = auth.create_custom_token(user.uid)
        
        return {
            "message": "Login successful",
            "uid": user.uid,
            "token": token,
            "token_type": "bearer"
        }
        
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/me", response_model=UserInDB)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Get current authenticated user's profile.
    """
    try:
        # Verify the ID token
        decoded_token = await auth_service.verify_token(credentials.credentials)
        user = auth.get_user(decoded_token['uid'])
        
        # Get user data from Firestore
        user_data = await user_service.get_document(user.uid)
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
            
        return {
            "id": user.uid,
            "email": user.email,
            "first_name": user_data.get('first_name', ''),
            "last_name": user_data.get('last_name', ''),
            "email_verified": user.email_verified,
            "created_at": user_data.get('created_at')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
