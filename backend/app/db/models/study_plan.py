from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum as SQLAlchemyEnum, DateTime
from sqlalchemy.orm import relationship
from ...database import Base
from ..enums import StudyPlanStatus, StudyBlockStatus # Importuj enumy
from datetime import datetime
class StudyPlan(Base):
      __tablename__ = "study_plans"
      id = Column(Integer, primary_key=True, index=True)
      name = Column(String, index=True, nullable=True)
      created_at = Column(DateTime, default=datetime.utcnow)
      status = Column(SQLAlchemyEnum(StudyPlanStatus, name="study_plan_status_enum"), default=StudyPlanStatus.ACTIVE)
      user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
      subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
      
      owner = relationship("User") # Ak User nemá spätný vzťah `study_plans`
      subject = relationship("Subject") # Ak Subject nemá spätný vzťah `study_plans`
      
      study_blocks = relationship("StudyBlock", back_populates="study_plan", cascade="all, delete-orphan")

class StudyBlock(Base):
      __tablename__ = "study_blocks"
      id = Column(Integer, primary_key=True, index=True)
      scheduled_at = Column(DateTime, nullable=True)
      duration_minutes = Column(Integer, nullable=True)
      status = Column(SQLAlchemyEnum(StudyBlockStatus, name="study_block_status_enum"), default=StudyBlockStatus.PLANNED)
      notes = Column(Text, nullable=True)
      study_plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False)
      topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
      
      study_plan = relationship("StudyPlan", back_populates="study_blocks")
      topic = relationship("Topic") # Predpokladá, že Topic nepotrebuje spätný vzťah k blokom
