from sqlalchemy import Column, Float, Integer, String, Text, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from ..base import Base
from ..enums import TopicStatus, UserDifficulty # Importuj enumy odtiaľto
class Topic(Base):
      __tablename__ = "topics"
      id = Column(Integer, primary_key=True, index=True)
      name = Column(String, index=True, nullable=False)
      user_strengths = Column(Text, nullable=True)
      user_weaknesses = Column(Text, nullable=True)
      user_difficulty = Column(SQLAlchemyEnum(UserDifficulty, name="user_difficulty_enum"), nullable=True)
      status = Column(SQLAlchemyEnum(TopicStatus, name="topic_status_enum"), default=TopicStatus.NOT_STARTED, nullable=False)
      ai_difficulty_score = Column(Float, nullable=True) # Napr. 0.0 (ľahké) až 1.0 (ťažké)
      ai_estimated_duration = Column(Integer, nullable=True) # Odhadovaná dĺžka v minútach od AI
      subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
      subject = relationship("Subject", back_populates="topics")