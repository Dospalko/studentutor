# backend/app/config.py
from pydantic_settings import BaseSettings # Uisti sa, že importuješ BaseSettings z pydantic_settings
from dotenv import load_dotenv
import os

load_dotenv() # Načíta premenné z .env súboru

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/default_tutor_app.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default_secret_key") # TOTO JE DÔLEŽITÉ
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    MEDIA_FILES_BASE_DIR: str = os.getenv("MEDIA_FILES_BASE_DIR", "./media_files_data")
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8' # Pridaj toto pre istotu

settings = Settings()