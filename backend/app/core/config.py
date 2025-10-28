from pydantic import BaseSettings, AnyHttpUrl, validator, Field
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
import json

# Load environment variables from .env file if it exists
load_dotenv()

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    SERVER_NAME: str = os.getenv("SERVER_NAME", "Auralie API")
    SERVER_HOST: AnyHttpUrl = os.getenv("SERVER_HOST", "http://localhost:8000")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str] | str:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Firebase Configuration
    FIREBASE_CREDENTIALS: dict = Field(
        default_factory=lambda: json.loads(os.getenv("FIREBASE_CREDENTIALS_JSON", "{}"))
    )
    FIREBASE_DATABASE_URL: str = os.getenv("FIREBASE_DATABASE_URL", "")
    
    # Firebase Authentication
    FIREBASE_API_KEY: str = os.getenv("FIREBASE_API_KEY", "")
    FIREBASE_AUTH_DOMAIN: str = os.getenv("FIREBASE_AUTH_DOMAIN", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    
    # Model Paths
    CYCLE_PREDICTION_MODEL_PATH: str = os.getenv("CYCLE_PREDICTION_MODEL_PATH", "./models/cycle_prediction")
    SYMPTOM_ANALYSIS_MODEL_PATH: str = os.getenv("SYMPTOM_ANALYSIS_MODEL_PATH", "./models/symptom_analysis")

    ENABLE_ML_PREDICTIONS: bool = True
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# Create settings instance
settings = Settings()
