from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Student Management System"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # MongoDB Settings
    MONGO_URI: str = "mongodb://mongodb:27017"
    DATABASE_NAME: str = "sms_db"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

settings = Settings()
