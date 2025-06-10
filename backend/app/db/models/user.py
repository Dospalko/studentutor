from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from ..base import Base
class User(Base):
      __tablename__ = "users"
      id = Column(Integer, primary_key=True, index=True)
      email = Column(String, unique=True, index=True, nullable=False)
      hashed_password = Column(String, nullable=False)
      full_name = Column(String, index=True, nullable=True)
      is_active = Column(Boolean, default=True)
      subjects = relationship("Subject", back_populates="owner", cascade="all, delete-orphan")
      # study_plans = relationship("StudyPlan", back_populates="owner", cascade="all, delete-orphan") # Ak by sme chceli tento vzťah
      subjects = relationship("Subject", back_populates="owner", cascade="all, delete-orphan")
    # Nový vzťah pre materiály, ktoré používateľ nahral (naprieč všetkými jeho predmetmi)
      study_materials_uploaded = relationship("StudyMaterial", back_populates="owner", cascade="all, delete-orphan")
      achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")