from pydantic import BaseModel, Field
from typing import Optional
from ..db.enums import TopicStatus, UserDifficulty # Importuj enumy z ich nového miesta
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
      subject_id: int
      status: TopicStatus

      ai_difficulty_score: Optional[float] = None
      ai_estimated_duration: Optional[int] = None
      class Config:
          from_attributes = True