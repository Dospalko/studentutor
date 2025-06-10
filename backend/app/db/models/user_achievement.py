from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..base import Base

class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    achieved_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")
    
    # Môžeš pridať unikátne obmedzenie, aby používateľ nemohol získať rovnaký achievement viackrát
    # from sqlalchemy.schema import UniqueConstraint
    # __table_args__ = (UniqueConstraint('user_id', 'achievement_id', name='uq_user_achievement'),)