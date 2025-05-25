# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from .models import TopicStatus, UserDifficulty # Importuj enumy z models.py

# --- Topic Schemas ---
class TopicBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    user_strengths: Optional[str] = None
    user_weaknesses: Optional[str] = None
    user_difficulty: Optional[UserDifficulty] = None
    status: Optional[TopicStatus] = TopicStatus.NOT_STARTED # Default pre vytváranie

class TopicCreate(TopicBase):
    pass # subject_id sa dodá z URL alebo v logike routra

class TopicUpdate(BaseModel): # Pri update chceme všetky polia voliteľné
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    user_strengths: Optional[str] = None
    user_weaknesses: Optional[str] = None
    user_difficulty: Optional[UserDifficulty] = None
    status: Optional[TopicStatus] = None

class Topic(TopicBase): # Schéma pre vrátenie z API
    id: int
    subject_id: int
    status: TopicStatus # Tu by mal byť status povinný, keďže DB ho má ako not-nullable

    class Config:
        from_attributes = True # Kedysi orm_mode = True

# --- Subject Schemas ---
class SubjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel): # Pri update chceme všetky polia voliteľné
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None

class Subject(SubjectBase): # Schéma pre vrátenie z API
    id: int
    owner_id: int
    topics: List[Topic] = [] # Zobrazí témy pri načítaní predmetu

    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    # subjects: List[Subject] = [] # Voliteľné

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None