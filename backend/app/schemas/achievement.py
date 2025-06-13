from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.db.enums import AchievementCriteriaType # Importuj enum

class AchievementBase(BaseModel):
    name: str
    description: str
    icon_name: Optional[str] = None
    criteria_type: Optional[AchievementCriteriaType] = None
    criteria_value: Optional[int] = None

class AchievementCreate(AchievementBase): # Pre administrátora na vytváranie achievementov
    pass

class Achievement(AchievementBase): # Pre response z API
    id: int

    class Config:
        from_attributes = True

class UserAchievementBase(BaseModel):
    achievement_id: int
    achieved_at: datetime

class UserAchievementCreate(UserAchievementBase): # Ak by sa prideľovali manuálne
    user_id: int
    pass

class UserAchievement(UserAchievementBase): # Pre response z API (keď sa získava userov profil)
    id: int
    user_id: int
    achievement: Achievement # Vnorené detaily achievementu

    class Config:
        from_attributes = True