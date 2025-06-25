from __future__ import annotations

import json
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.db.enums import MaterialTypeEnum


# ───────────────────────────────
#        SHARED BASE
# ───────────────────────────────
class StudyMaterialBase(BaseModel):
    title:         Optional[str]                = Field(None, max_length=255)
    description:   Optional[str]                = None
    material_type: Optional[MaterialTypeEnum]   = None


class StudyMaterialCreate(StudyMaterialBase):
    pass


class StudyMaterialUpdate(StudyMaterialBase):
    pass


# ───────────────────────────────
#        SUMMARY RESPONSE
# ───────────────────────────────
class MaterialSummaryResponse(BaseModel):
    material_id: int
    file_name:   str
    summary:     Optional[str] = None
    ai_error:    Optional[str] = None
    word_count: Optional[int] = None


# ───────────────────────────────
#        MAIN DTO
# ───────────────────────────────
class StudyMaterial(StudyMaterialBase):
    id:          int
    file_name:   str
    file_type:   Optional[str] = None
    file_size:   Optional[int] = None
    uploaded_at: datetime
    subject_id:  int
    owner_id:    int

    tags: List[str] = []  # ← už Python list!

    # DB (TEXT) → Python list
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
