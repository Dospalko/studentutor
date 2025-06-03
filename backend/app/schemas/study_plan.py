from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..db.enums import StudyPlanStatus, StudyBlockStatus # Importuj enumy
from .topic import Topic # StudyBlock obsahuje Topic
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

class StudyBlock(StudyBlockBase):
      id: int
      study_plan_id: int
      topic_id: int
      topic: Topic

      class Config:
          from_attributes = True

class StudyPlanBase(BaseModel):
      name: Optional[str] = None

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
      status: StudyPlanStatus
      subject_name: Optional[str] = None # Doplníme v routeri
      study_blocks: List[StudyBlock] = []

      class Config:
          from_attributes = True