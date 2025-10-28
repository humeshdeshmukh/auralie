from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import api_router
from .core.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Auralie API for cycle tracking and prediction",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Auralie API",
        "version": settings.VERSION,
        "docs": "/docs",
        "redoc": "/redoc"
    }

# Handle startup events
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Auralie API...")
    # Initialize any required services here
    from .services.predict_service import PredictService
    # This will initialize the model on startup
    predictor = PredictService()
    logger.info("Auralie API started successfully")

# Handle shutdown events
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Auralie API...")