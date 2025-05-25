# backend/app/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from .database import Base
import enum # Pre Python enum

# Pôvodný User model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True, nullable=True) # Urobil som nullable=True
    is_active = Column(Boolean, default=True)

    subjects = relationship("Subject", back_populates="owner") # Vzťah k predmetom

# Nový model pre Predmet
class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")

# Enum pre stav témy (môžeš rozšíriť)
class TopicStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    NEEDS_REVIEW = "needs_review"

# Enum pre vnímanú obtiažnosť používateľom
class UserDifficulty(str, enum.Enum):
    VERY_EASY = "very_easy"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    VERY_HARD = "very_hard"

# Nový model pre Tému
class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    # Používateľom zadané silné/slabé stránky alebo poznámky k téme
    user_strengths = Column(Text, nullable=True)
    user_weaknesses = Column(Text, nullable=True)
    # Používateľom vnímaná obtiažnosť
    user_difficulty = Column(SQLAlchemyEnum(UserDifficulty), nullable=True)
    # AI odhadovaná obtiažnosť (neskôr)
    # ai_difficulty_score = Column(Float, nullable=True)
    status = Column(SQLAlchemyEnum(TopicStatus), default=TopicStatus.NOT_STARTED, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)

    subject = relationship("Subject", back_populates="topics")
    # Neskôr môžeme pridať vzťah k študijným blokom v kalendári