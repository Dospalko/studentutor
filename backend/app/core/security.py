# backend/app/core/security.py
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt
from pydantic import ValidationError # Ak by si validoval token data

# Ak by si SECRET_KEY a ALGORITHM potreboval aj tu (napr. pre JWT), importuj settings
# from ..config import settings # Alebo ich prijímaj ako argumenty funkcií

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Password Hashing ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# --- JWT Token Handling (Príklad, ak by si to chcel presunúť z auth.py routera) ---
# Ak zostane v auth.py, tak to tu nemusí byť.
# Tento kód by si musel prispôsobiť podľa toho, ako máš JWT v auth.py.
"""
# Príklad, ak by si chcel presunúť JWT logiku sem:
from ..config import settings # Potrebuješ settings pre kľúče a algoritmus

ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
SECRET_KEY = settings.SECRET_KEY # Pozor na cyklické importy, ak config importuje niečo, čo závisí od core

def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Funkcia na dekódovanie tokenu by tiež mohla byť tu
"""