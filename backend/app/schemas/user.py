from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
# from .subject import Subject # Pre cyklickú závislosť, ak User.subjects je List[Subject]
class UserBase(BaseModel):
      email: EmailStr
      full_name: Optional[str] = None

class UserCreate(UserBase):
      password: str = Field(min_length=6)

class UserUpdate(BaseModel):
      email: Optional[EmailStr] = None
      full_name: Optional[str] = None
      is_active: Optional[bool] = None

class User(UserBase):
      id: int
      is_active: bool
      # Ak by si tu chcel subjects: List[Subject], použi stringovú anotáciu:
      # subjects: List['Subject'] = [] # A na konci súboru User.model_rebuild()

      class Config:
          from_attributes = True
  
  # Ak by si potreboval vyriešiť dopredné referencie:
  # from .subject import Subject # Tento import by mal byť tu dole
  # User.model_rebuild()