from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from ...database import Base # Alebo from ..base_class import Base

class User(Base):
      __tablename__ = "users"
      id = Column(Integer, primary_key=True, index=True)
      email = Column(String, unique=True, index=True, nullable=False)
      hashed_password = Column(String, nullable=False)
      full_name = Column(String, index=True, nullable=True)
      is_active = Column(Boolean, default=True)
      subjects = relationship("Subject", back_populates="owner", cascade="all, delete-orphan")
      # study_plans = relationship("StudyPlan", back_populates="owner", cascade="all, delete-orphan") # Ak by sme chceli tento vzťah