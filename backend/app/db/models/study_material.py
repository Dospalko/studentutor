from sqlalchemy import ARRAY, Column, Integer, String, Text, DateTime, Enum as SQLAlchemyEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..base import Base# Importuj Base zo správneho miesta
from app.db.enums import MaterialTypeEnum # Importuj enum pre typ materiálu

class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False) # Pôvodný názov súboru
    # Relatívna cesta k súboru od MEDIA_ROOT (napr. user_1/subject_5/moj_subor.pdf)
    file_path = Column(String, nullable=False, unique=True) 
    file_type = Column(String, nullable=True) # MIME typ, napr. application/pdf
    file_size = Column(Integer, nullable=True) # Veľkosť v bajtoch
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    title = Column(String, index=True, nullable=True) # Voliteľný názov zadaný používateľom
    description = Column(Text, nullable=True) # Voliteľný popis
    material_type = Column(SQLAlchemyEnum(MaterialTypeEnum, name="material_type_enum"), nullable=True)

    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False) # Kto nahral súbor
    extracted_text = Column(Text, nullable=True) # NOVÝ STĹPEC
    ai_summary = Column(Text, nullable=True)
    ai_summary_error = Column(Text, nullable=True)
    tags = Column(ARRAY(String), default=[])  # ← pridaj toto
    subject = relationship("Subject", back_populates="materials")
    owner = relationship("User", back_populates="study_materials_uploaded") # Nový vzťah v User modeli subject = relationship("Subject", back_populates="materials")