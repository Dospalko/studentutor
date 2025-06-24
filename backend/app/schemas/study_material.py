from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.db.enums import MaterialTypeEnum # Správny import enumov

class StudyMaterialBase(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    material_type: Optional[MaterialTypeEnum] = None

class StudyMaterialCreate(StudyMaterialBase):
    # Samotný súbor (UploadFile) sa bude posielať oddelene od týchto metadát
    pass

class StudyMaterialUpdate(StudyMaterialBase):
    # Pri update môžeme chcieť zmeniť len tieto polia
    pass

class MaterialSummaryResponse(BaseModel):
    material_id: int
    file_name: str
    summary: Optional[str] = None
    ai_error: Optional[str] = None

class StudyMaterial(StudyMaterialBase): # Pre response z API
    id: int
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None # v bajtoch
    uploaded_at: datetime
    subject_id: int
    owner_id: int
    tags: Optional[List[str]] = []
    # file_path sa zvyčajne neposiela na frontend, namiesto toho sa vygeneruje URL na stiahnutie

    class Config:
        from_attributes = True


