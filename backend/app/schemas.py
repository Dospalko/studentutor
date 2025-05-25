# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from .models import TopicStatus, UserDifficulty # Importuj enumy

# --- Topic Schemas ---
class TopicBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    user_strengths: Optional[str] = None
    user_weaknesses: Optional[str] = None
    user_difficulty: Optional[UserDifficulty] = None
    status: Optional[TopicStatus] = TopicStatus.NOT_STARTED

class TopicCreate(TopicBase):
    pass # subject_id sa pridá v CRUD funkcii alebo sa vezme z URL

class TopicUpdate(TopicBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    # Všetky polia sú voliteľné pri update

class Topic(TopicBase):
    id: int
    subject_id: int
    # ai_difficulty_score: Optional[float] = None # Neskôr

    class Config:
        from_attributes = True

# --- Subject Schemas ---
class SubjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(SubjectBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    # Všetky polia sú voliteľné pri update

class Subject(SubjectBase):
    id: int
    owner_id: int
    topics: List[Topic] = [] # Zobrazí témy pri načítaní predmetu

    class Config:
        from_attributes = True


# --- User Schemas (aktualizácia pre vzťahy) ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase): # Toto je to, čo sa vracia z API
    id: int
    is_active: bool
    # subjects: List[Subject] = [] # Môžeme pridať, ak chceme, aby /users/me vracalo aj predmety

    class Config:
        from_attributes = True

# Token schémy (zostávajú rovnaké)
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None