# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime # Pre typovanie
from .models import TopicStatus, UserDifficulty, StudyPlanStatus, StudyBlockStatus # 
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



    # --- StudyBlock Schemas ---
class StudyBlockBase(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=0) # ge=0 znamená greater or equal to 0
    status: Optional[StudyBlockStatus] = StudyBlockStatus.PLANNED
    notes: Optional[str] = None

class StudyBlockCreate(StudyBlockBase):
    topic_id: int # Pri vytváraní bloku musíme vedieť, ku ktorej téme patrí

class StudyBlockUpdate(BaseModel): # Pre PATCH-like update
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    status: Optional[StudyBlockStatus] = None
    notes: Optional[str] = None

class StudyBlock(StudyBlockBase): # Schéma pre vrátenie z API
    id: int
    study_plan_id: int
    topic_id: int
    topic: Topic # Vrátime aj info o téme

    class Config:
        from_attributes = True

# --- StudyPlan Schemas ---
class StudyPlanBase(BaseModel):
    name: Optional[str] = None
    status: Optional[StudyPlanStatus] = StudyPlanStatus.ACTIVE

class StudyPlanCreate(BaseModel): # Pre endpoint na generovanie plánu
    subject_id: int
    name: Optional[str] = None # Používateľ môže zadať názov, inak defaultný

class StudyPlanUpdate(BaseModel): # Pre PATCH-like update
    name: Optional[str] = None
    status: Optional[StudyPlanStatus] = None

class StudyPlan(StudyPlanBase): # Schéma pre vrátenie z API
    id: int
    user_id: int
    subject_id: int
    created_at: datetime
    status: StudyPlanStatus # Tu už povinné
    subject_name: Optional[str] = None # Pridáme pre jednoduchšie zobrazenie na FE
    study_blocks: List[StudyBlock] = []

    class Config:
        from_attributes = True