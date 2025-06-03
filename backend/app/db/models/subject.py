from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from ...database import Base
class Subject(Base):
      __tablename__ = "subjects"
      id = Column(Integer, primary_key=True, index=True)
      name = Column(String, index=True, nullable=False)
      description = Column(Text, nullable=True)
      owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
      owner = relationship("User", back_populates="subjects")
      topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
      # study_plans = relationship("StudyPlan", back_populates="subject", cascade="all, delete-orphan") # Ak by sme chceli tento vzťah