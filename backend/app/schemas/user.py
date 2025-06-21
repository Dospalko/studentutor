from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from .achievement import UserAchievement # Import novej schémy

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

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str
    
class User(UserBase):
      id: int
      is_active: bool
      achievements: List[UserAchievement] = [] # PRIDANÉ


      class Config:
          from_attributes = True
  
  # Ak by si potreboval vyriešiť dopredné referencie:
  # from .subject import Subject # Tento import by mal byť tu dole
  # User.model_rebuild()