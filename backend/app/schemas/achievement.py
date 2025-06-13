# backend/app/schemas/achievement.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.db.enums import AchievementCriteriaType

class AchievementBase(BaseModel):
    name: str
    description: str
    icon_name: Optional[str] = None
    criteria_type: Optional[AchievementCriteriaType] = None # Voliteľné pre 'all defined'
    criteria_value: Optional[int] = None # Voliteľné pre 'all defined'

class Achievement(AchievementBase): # Pre zobrazenie definície achievementu
    id: int

    class Config:
        from_attributes = True

class UserAchievementBase(BaseModel):
    achieved_at: datetime

class UserAchievement(UserAchievementBase): # Pre zobrazenie získaného achievementu
    id: int
    user_id: int
    achievement_id: int
    achievement: Achievement # Vnorené detaily achievementu

    class Config:
        from_attributes = True