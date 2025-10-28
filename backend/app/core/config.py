from pydantic import AnyHttpUrl, validator, Field, DirectoryPath, FilePath
from pydantic_settings import BaseSettings
from typing import List, Optional, Dict, Any, Union
import os
from pathlib import Path
from dotenv import load_dotenv
import json
import logging

# Load environment variables from .env file if it exists
load_dotenv()

# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # Application Configuration
    PROJECT_NAME: str = "Auralie"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    SERVER_NAME: str = os.getenv("SERVER_NAME", "Auralie API")
    SERVER_HOST: AnyHttpUrl = os.getenv("SERVER_HOST", "http://localhost:8000")
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:5000",
    ]

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Firebase Configuration
    FIREBASE_CREDENTIALS: dict = Field(
        default_factory=lambda: json.loads(
            os.getenv("FIREBASE_CREDENTIALS_JSON", "{}")
        )
    )
    FIREBASE_DATABASE_URL: str = os.getenv("FIREBASE_DATABASE_URL", "")
    FIREBASE_API_KEY: str = os.getenv("FIREBASE_API_KEY", "")
    FIREBASE_AUTH_DOMAIN: str = os.getenv("FIREBASE_AUTH_DOMAIN", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_STORAGE_BUCKET: str = os.getenv("FIREBASE_STORAGE_BUCKET", "")
    FIREBASE_MESSAGING_SENDER_ID: str = os.getenv("FIREBASE_MESSAGING_SENDER_ID", "")
    FIREBASE_APP_ID: str = os.getenv("FIREBASE_APP_ID", "")

    # ML Model Configuration
    ML_MODELS_DIR: str = str(BASE_DIR / "aiml" / "models")
    ML_LOGS_DIR: str = str(BASE_DIR / "aiml" / "logs")
    
    # Gemini AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL_NAME: str = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
    GEMINI_TEMPERATURE: float = float(os.getenv("GEMINI_TEMPERATURE", "0.2"))
    GEMINI_MAX_TOKENS: int = int(os.getenv("GEMINI_MAX_TOKENS", "1024"))
    
    # Cycle Prediction Model
    CYCLE_PREDICTION_ENABLED: bool = os.getenv("CYCLE_PREDICTION_ENABLED", "True").lower() == "true"
    CYCLE_PREDICTION_MODEL_FILENAME: str = "cycle_predictor.joblib"
    CYCLE_SCALER_FILENAME: str = "cycle_scaler.joblib"
    CYCLE_METADATA_FILENAME: str = "cycle_metadata.json"
    
    # Model Training Parameters
    MODEL_TRAIN_TEST_SPLIT: float = 0.2
    MODEL_RANDOM_STATE: int = 42
    MODEL_N_ESTIMATORS: int = 100
    
    # Minimum number of cycles required for training
    MIN_CYCLES_FOR_TRAINING: int = 3
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Create required directories on init
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._create_directories()
    
    def _create_directories(self):
        """Create required directories if they don't exist"""
        os.makedirs(self.ML_MODELS_DIR, exist_ok=True)
        os.makedirs(self.ML_LOGS_DIR, exist_ok=True)
    
    @property
    def cycle_model_path(self) -> str:
        return str(Path(self.ML_MODELS_DIR) / self.CYCLE_PREDICTION_MODEL_FILENAME)
    
    @property
    def cycle_scaler_path(self) -> str:
        return str(Path(self.ML_MODELS_DIR) / self.CYCLE_SCALER_FILENAME)
    
    @property
    def cycle_metadata_path(self) -> str:
        return str(Path(self.ML_MODELS_DIR) / self.CYCLE_METADATA_FILENAME)
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"  # Allow extra fields in .env without raising validation errors

# Create settings instance
settings = Settings()
