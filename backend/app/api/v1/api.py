from fastapi import APIRouter
from .endpoints import cycles, predict, auth

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(cycles.router, prefix="/cycles", tags=["Cycle Tracking"])
api_router.include_router(predict.router, prefix="/predict", tags=["Predictions"])
