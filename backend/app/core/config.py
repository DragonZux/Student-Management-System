from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Student Management System"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # MongoDB Settings
    MONGO_URI: str = "mongodb://mongodb:27017"
    DATABASE_NAME: str = "sms_db"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
