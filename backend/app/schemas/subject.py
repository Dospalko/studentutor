from pydantic import BaseModel, Field
from typing import Optional, List
from .topic import Topic # Subject obsahuje zoznam Topic
class SubjectBase(BaseModel):
      name: str = Field(min_length=1, max_length=100)
      description: Optional[str] = None

class SubjectCreate(SubjectBase):
      pass

class SubjectUpdate(BaseModel):
      name: Optional[str] = Field(None, min_length=1, max_length=100)
      description: Optional[str] = None

from .study_material import StudyMaterial # Import novej schémy

class Subject(SubjectBase): # Uprav existujúcu Subject schému
    id: int
    owner_id: int
    topics: List[Topic] = []
    materials: List[StudyMaterial] = [] # PRIDANÉ

    class Config:
        from_attributes = True