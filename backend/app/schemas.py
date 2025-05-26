# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, Field, validator # Pridaj validator, ak ho chceš použiť na debug
from typing import Optional, List
from datetime import datetime
from .models import TopicStatus, UserDifficulty, StudyPlanStatus, StudyBlockStatus

# --- Topic Schemas ---
class TopicBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    user_strengths: Optional[str] = None
    user_weaknesses: Optional[str] = None
    user_difficulty: Optional[UserDifficulty] = None
    status: Optional[TopicStatus] = TopicStatus.NOT_STARTED

class TopicCreate(TopicBase):
    pass

class TopicUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    user_strengths: Optional[str] = None
    user_weaknesses: Optional[str] = None
    user_difficulty: Optional[UserDifficulty] = None
    status: Optional[TopicStatus] = None

class Topic(TopicBase):
    id: int
    subject_id: int # Toto pole by tu malo byť, ak ho Topic model má
    status: TopicStatus # Status je v DB not-nullable

    class Config:
        from_attributes = True

# --- Subject Schemas ---
class SubjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None

class Subject(SubjectBase):
    id: int
    owner_id: int
    topics: List[Topic] = []

    class Config:
        from_attributes = True

# --- User Schemas ---
# ... (User schémy zostávajú rovnaké) ...

# --- StudyBlock Schemas ---
class StudyBlockBase(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    status: Optional[StudyBlockStatus] = StudyBlockStatus.PLANNED
    notes: Optional[str] = None

class StudyBlockCreate(StudyBlockBase):
    topic_id: int

class StudyBlockUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=0)
    status: Optional[StudyBlockStatus] = None
    notes: Optional[str] = None

class StudyBlock(StudyBlockBase): # Schéma pre vrátenie z API
    id: int
    study_plan_id: int
    topic_id: int # Dôležité pre frontend na identifikáciu
    topic: Topic   # Očakávame, že topic tu bude vždy (nie Optional)

    class Config:
        from_attributes = True

# --- StudyPlan Schemas ---
class StudyPlanBase(BaseModel):
    name: Optional[str] = None
    # status tu nemusí byť, lebo pri create bude vždy ACTIVE, a pri update je optional
    # status: Optional[StudyPlanStatus] = StudyPlanStatus.ACTIVE 

class StudyPlanCreate(BaseModel):
    subject_id: int
    name: Optional[str] = None

class StudyPlanUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[StudyPlanStatus] = None

class StudyPlan(StudyPlanBase):
    id: int
    user_id: int
    subject_id: int
    created_at: datetime
    status: StudyPlanStatus # Tu je už povinné, lebo DB ho má
    subject_name: Optional[str] = None # Doplníme v routeri
    study_blocks: List[StudyBlock] = []

    class Config:
        from_attributes = True
# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None