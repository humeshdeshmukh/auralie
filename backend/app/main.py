from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional
import uvicorn
import os

from .core.config import settings
from .api.endpoints import users, auth, cycles, symptoms, predictions, database
from .services.firebase_service import firebase_service

app = FastAPI(
    title=settings.SERVER_NAME,
    description="Auralie API - AI-Powered Menstrual Health Assistant",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(cycles.router, prefix="/api/v1/cycles", tags=["Menstrual Cycles"])
app.include_router(symptoms.router, prefix="/api/v1/symptoms", tags=["Symptom Tracking"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["AI Predictions"])
app.include_router(database.router, prefix="/api/v1/db", tags=["Database"])

@app.on_event("startup")
async def startup_event():
    """Initialize Firebase on startup"""
    try:
        # This will initialize Firebase if not already initialized
        firebase_service
    except Exception as e:
        print(f"Error initializing Firebase: {str(e)}")
        raise

@app.get("/")
async def root():
    return {
        "message": "Welcome to Auralie API",
        "docs": "/api/docs",
        "version": "0.1.0"
    }

@app.get("/health")
async def health_check():
    try:
        # Simple health check that verifies Firebase is initialized
        if firebase_service is not None:
            return {
                "status": "healthy",
                "services": {
                    "database": "connected",
                    "authentication": "available"
                }
            }
        return {
            "status": "degraded",
            "services": {
                "database": "disconnected",
                "authentication": "unknown"
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "services": {
                "database": "error",
                "authentication": "error"
            }
        }

# For development
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
