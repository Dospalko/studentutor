# backend/app/config.py
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/default_tutor_app.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default_secret_key")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    MEDIA_FILES_BASE_DIR: str = os.getenv("MEDIA_FILES_BASE_DIR", "/app/media_files_data")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_STARTTLS: bool
    MAIL_SSL_TLS: bool
    FRONTEND_URL: str

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
