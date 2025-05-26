# backend/app/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Enum as SQLAlchemyEnum, DateTime, Interval # Pridaj DateTime, Interval
from sqlalchemy.orm import relationship
from .database import Base
import enum
from datetime import datetime # Pre default hodnoty


# Enum pre stav témy
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

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    subjects = relationship("Subject", back_populates="owner", cascade="all, delete-orphan") # Cascade pre predmety

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan") # Cascade pre témy

class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    user_strengths = Column(Text, nullable=True)
    user_weaknesses = Column(Text, nullable=True)
    user_difficulty = Column(SQLAlchemyEnum(UserDifficulty, name="user_difficulty_enum"), nullable=True) # Pridaný name pre enum
    status = Column(SQLAlchemyEnum(TopicStatus, name="topic_status_enum"), default=TopicStatus.NOT_STARTED, nullable=False) # Pridaný name
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    subject = relationship("Subject", back_populates="topics")


    # Enum pre status študijného plánu
class StudyPlanStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"

# Enum pre status študijného bloku
class StudyBlockStatus(str, enum.Enum):
    PLANNED = "planned"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    IN_PROGRESS = "in_progress"


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=True) # Napr. "Môj plán pre Matematiku I"
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLAlchemyEnum(StudyPlanStatus, name="study_plan_status_enum"), default=StudyPlanStatus.ACTIVE)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)

    owner = relationship("User") # Jednosmerný vzťah, ak nepotrebujeme user.study_plans
    subject = relationship("Subject") # Jednosmerný vzťah

    study_blocks = relationship("StudyBlock", back_populates="study_plan", cascade="all, delete-orphan")

class StudyBlock(Base):
    __tablename__ = "study_blocks"

    id = Column(Integer, primary_key=True, index=True)
    # Odporúčaný dátum a čas (môžeme začať len s dátumom, DateTime to pokryje)
    scheduled_at = Column(DateTime, nullable=True)
    # Odporúčaná dĺžka štúdia (ukladáme ako Interval, alebo Integer v minútach)
    # Pre jednoduchosť začneme s Integer (minúty)
    duration_minutes = Column(Integer, nullable=True) # Napr. 60 minút
    status = Column(SQLAlchemyEnum(StudyBlockStatus, name="study_block_status_enum"), default=StudyBlockStatus.PLANNED)
    notes = Column(Text, nullable=True) # Poznámky používateľa k tomuto bloku

    study_plan_id = Column(Integer, ForeignKey("study_plans.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)

    study_plan = relationship("StudyPlan", back_populates="study_blocks")
    topic = relationship("Topic") # Jednosmerný vzťah