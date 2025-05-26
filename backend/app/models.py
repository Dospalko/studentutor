# backend/app/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Enum as SQLAlchemyEnum, DateTime, event # Pridaj event
from sqlalchemy.orm import relationship
from sqlalchemy.engine import Engine # Pre typovanie
from .database import Base
import enum
from datetime import datetime

# --- Event listener pre SQLite na zapnutie Foreign Keys ---
# Toto je dôležité pre SQLite, aby rešpektovalo foreign key constraints
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if dbapi_connection.__class__.__module__ == "sqlite3": # Over, či ide o SQLite pripojenie
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

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


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    subjects = relationship("Subject", back_populates="owner", cascade="all, delete-orphan")

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False) # SQLite by mal mať ON DELETE CASCADE, ak nie je explicitne
    owner = relationship("User", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    user_strengths = Column(Text, nullable=True)
    user_weaknesses = Column(Text, nullable=True)
    user_difficulty = Column(SQLAlchemyEnum(UserDifficulty, name="user_difficulty_enum"), nullable=True)
    status = Column(SQLAlchemyEnum(TopicStatus, name="topic_status_enum"), default=TopicStatus.NOT_STARTED, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False) # SQLite by mal mať ON DELETE CASCADE
    subject = relationship("Subject", back_populates="topics")

class StudyPlan(Base):
    __tablename__ = "study_plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(SQLAlchemyEnum(StudyPlanStatus, name="study_plan_status_enum"), default=StudyPlanStatus.ACTIVE)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False) # Pridané ondelete
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False) # Pridané ondelete
    owner = relationship("User")
    subject = relationship("Subject")
    study_blocks = relationship("StudyBlock", back_populates="study_plan", cascade="all, delete-orphan")

class StudyBlock(Base):
    __tablename__ = "study_blocks"
    id = Column(Integer, primary_key=True, index=True)
    scheduled_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    status = Column(SQLAlchemyEnum(StudyBlockStatus, name="study_block_status_enum"), default=StudyBlockStatus.PLANNED)
    notes = Column(Text, nullable=True)
    study_plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False) # Pridané ondelete
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False) # Pridané ondelete pre integritu
    study_plan = relationship("StudyPlan", back_populates="study_blocks")
    topic = relationship("Topic") # Jednosmerný vzťah, ktorý by mal byť vždy platný