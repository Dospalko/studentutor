# backend/app/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional

# Základný model pre užívateľa, ktorý sa bude vracať z API (bez hesla)
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

# Model pre vytváranie užívateľa (obsahuje heslo)
class UserCreate(UserBase):
    password: str

# Model pre čítanie užívateľa z DB (obsahuje ID)
class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True # Povolí pydantic modelu čítať dáta aj z ORM atribútov

# Token schémy
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None