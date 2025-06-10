from sqlalchemy import Column, Integer, String, Enum as SQLAlchemyEnum, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.db.enums import AchievementCriteriaType

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True, nullable=False)
    description = Column(Text, nullable=False)
    icon_name = Column(String, nullable=True) # Názov ikony (napr. z Lucide) alebo cesta k obrázku
    
    # Ako sa tento achievement získava (pre jednoduchosť, neskôr môže byť zložitejšie)
    criteria_type = Column(SQLAlchemyEnum(AchievementCriteriaType, name="achievement_criteria_type_enum"), nullable=True)
    criteria_value = Column(Integer, nullable=True) # Napr. 5 pre "dokonči 5 tém"
    
    # Vzťah k používateľom, ktorí tento achievement získali
    user_achievements = relationship("UserAchievement", back_populates="achievement")