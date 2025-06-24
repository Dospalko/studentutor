from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SQLAlchemyEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..base import Base
from app.db.enums import MaterialTypeEnum


class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id          = Column(Integer, primary_key=True, index=True)
    file_name   = Column(String,  nullable=False)
    file_path   = Column(String,  nullable=False, unique=True)
    file_type   = Column(String,  nullable=True)
    file_size   = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    title        = Column(String, index=True, nullable=True)
    description  = Column(Text,   nullable=True)
    material_type = Column(SQLAlchemyEnum(MaterialTypeEnum, name="material_type_enum"), nullable=True)

    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    owner_id   = Column(Integer, ForeignKey("users.id",    ondelete="CASCADE"), nullable=False)

    extracted_text  = Column(Text, nullable=True)
    ai_summary      = Column(Text, nullable=True)
    ai_summary_error = Column(Text, nullable=True)

    # !!! SQLite nemá ARRAY -> ukladáme JSON-encoded list do TEXT
    tags = Column(Text, default="[]")            # ← NEW

    subject = relationship("Subject", back_populates="materials")
    owner   = relationship("User",    back_populates="study_materials_uploaded")
