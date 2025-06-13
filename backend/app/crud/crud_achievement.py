# backend/app/crud/crud_achievement.py
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.models.achievement import Achievement
from app.db.models.user_achievement import UserAchievement
# from app.db.models.user import User as UserModel # Nepoužité priamo tu

def get_all_defined_achievements(db: Session) -> List[Achievement]:
    return db.query(Achievement).order_by(Achievement.name).all()

def get_user_achievements(db: Session, user_id: int) -> List[UserAchievement]:
    return db.query(UserAchievement)\
        .filter(UserAchievement.user_id == user_id)\
        .options(joinedload(UserAchievement.achievement))\
        .order_by(UserAchievement.achieved_at.desc()).all()