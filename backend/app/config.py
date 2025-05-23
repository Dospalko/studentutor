# backend/app/config.py
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv() # Načíta premenné z .env súboru

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./default_tutor_app.db") # Zmenená defaultná hodnota
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default_secret_key")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()