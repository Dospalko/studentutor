# backend/app/schemas.py
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
# Importuj enumy z models.py, ak ich tam máš centrálne
from .models import TopicStatus, UserDifficulty, StudyPlanStatus, StudyBlockStatus

# --- User Schemas --- (DOPLNENÉ)
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase): # Túto triedu hľadalo v predchádzajúcej chybe v crud.py
    password: str = Field(min_length=6) # Príklad validácie pre heslo

class UserUpdate(BaseModel): # Schéma pre aktualizáciu používateľa
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    # Heslo by sa malo aktualizovať cez samostatný endpoint

class User(UserBase): # Toto je schéma, ktorú hľadá router v users.py
    id: int
    is_active: bool
    # Ak by si chcel vrátiť aj predmety používateľa priamo z /users/me, odkomentuj:
    # subjects: List['Subject'] = [] # Použi stringovú anotáciu pre 'Subject', aby sa predišlo cykl. importu

    class Config:
        from_attributes = True


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
    user_strengths: Optional[str] = None # Môže byť null na vymazanie
    user_weaknesses: Optional[str] = None # Môže byť null na vymazanie
    user_difficulty: Optional[UserDifficulty] = None # Môže byť null na vymazanie
    status: Optional[TopicStatus] = None

class Topic(TopicBase):
    id: int
    subject_id: int
    status: TopicStatus

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
    description: Optional[str] = None # Môže byť null na vymazanie

class Subject(SubjectBase):
    id: int
    owner_id: int
    topics: List[Topic] = [] # Zobrazí témy pri načítaní predmetu

    class Config:
        from_attributes = True


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
    notes: Optional[str] = None # Môže byť null na vymazanie

class StudyBlock(StudyBlockBase):
    id: int
    study_plan_id: int
    topic_id: int
    topic: Topic # Očakávame, že topic tu bude vždy

    class Config:
        from_attributes = True

# --- StudyPlan Schemas ---
class StudyPlanBase(BaseModel):
    name: Optional[str] = None

class StudyPlanCreate(BaseModel):
    subject_id: int
    name: Optional[str] = None

class StudyPlanUpdate(BaseModel):
    name: Optional[str] = None # Môže byť null na vymazanie
    status: Optional[StudyPlanStatus] = None

class StudyPlan(StudyPlanBase):
    id: int
    user_id: int
    subject_id: int
    created_at: datetime
    status: StudyPlanStatus
    subject_name: Optional[str] = None
    study_blocks: List[StudyBlock] = []

    class Config:
        from_attributes = True

# --- Token Schemas --- (Tieto si tam mal, ponechávam)
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Ak by si mal cyklickú závislosť medzi Subject a User (napr. User.subjects a Subject.owner),
# a potreboval by si aktualizovať dopredné referencie po definovaní všetkých modelov:
# User.model_rebuild() # Alebo User.update_forward_refs() pre starší Pydantic
# Subject.model_rebuild()