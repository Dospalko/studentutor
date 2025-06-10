from sqlalchemy.orm import Session
from typing import List
from app.db.models.achievement import Achievement
from app.db.models.user_achievement import UserAchievement
from app.db.models.user import User as UserModel

def get_all_defined_achievements(db: Session) -> List[Achievement]:
    return db.query(Achievement).order_by(Achievement.name).all()

def get_user_achievements(db: Session, user_id: int) -> List[UserAchievement]:
    # Načíta UserAchievement záznamy aj s detailmi samotného Achievementu
    return db.query(UserAchievement).filter(UserAchievement.user_id == user_id)\
        .join(Achievement).order_by(UserAchievement.achieved_at.desc()).all()