# backend/app/schemas/study_material.py

from __future__ import annotations
import json
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from app.db.enums import MaterialTypeEnum

class StudyMaterialBase(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    material_type: Optional[MaterialTypeEnum] = None

class StudyMaterialCreate(StudyMaterialBase):
    pass

class StudyMaterialUpdate(StudyMaterialBase):
    tags: Optional[List[str]] = Field(None)
    ai_summary: Optional[str]    = Field(None, alias="ai_summary")

    class Config:
        from_attributes = True
        extra = "ignore"   # ignore any other fields

class MaterialSummaryResponse(BaseModel):
    material_id: int
    file_name:   str
    summary:     Optional[str] = None
    ai_error:    Optional[str] = None
    word_count: Optional[int]   = None

class StudyMaterial(StudyMaterialBase):
    id:          int
    file_name:   str
    file_type:   Optional[str]
    file_size:   Optional[int]
    uploaded_at: datetime
    subject_id:  int
    owner_id:    int
    tags:        List[str] = []

    @field_validator("tags", mode="before")
    @classmethod
    def _deserialize_tags(cls, v):
        if v in (None, ""):
            return []
        if isinstance(v, list):
            return v
        try:
            return json.loads(v)
        except Exception:
            return [t.strip() for t in str(v).split(",") if t.strip()]

    class Config:
        from_attributes = True
