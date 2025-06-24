# backend/app/routers/study_materials.py
import json
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path

from app import crud
from app.db.models.user import User as UserModel 
from app.db.enums import MaterialTypeEnum, AchievementCriteriaType
from app.schemas import study_material as sm_schema
from app import file_utils
from app.database import get_db
from app.dependencies import get_current_active_user, get_current_user
from app.services.achievement_service import check_and_grant_achievements
from app.services.ai_service.materials_summary import extract_tags_from_text, summarize_text_with_openai

router = APIRouter(
    prefix="/subjects/{subject_id}/materials", 
    tags=["Study Materials (per Subject)"],
    dependencies=[Depends(get_current_active_user)]
)
material_router = APIRouter(
    prefix="/materials",
    tags=["Study Materials (general)"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=sm_schema.StudyMaterial, status_code=status.HTTP_201_CREATED)
async def upload_material_to_subject(
    subject_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    material_type: Optional[MaterialTypeEnum] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    material_meta = sm_schema.StudyMaterialCreate(
        title=title, description=description, material_type=material_type
    )
    db_material = crud.create_study_material(
        db=db, material_meta=material_meta, upload_file=file,
        subject_id=subject_id, owner_id=current_user.id
    )
    if not db_material:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to upload material.")
    
    check_and_grant_achievements(db, current_user, AchievementCriteriaType.STUDY_MATERIALS_UPLOADED_PER_SUBJECT)
    check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOTAL_MATERIALS_UPLOADED)
    
    return db_material

@router.get("/", response_model=List[sm_schema.StudyMaterial])
def get_materials_for_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    materials = crud.get_study_materials_for_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if materials is None: 
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or no materials available")
    return materials

@material_router.get("/{material_id}", response_model=sm_schema.StudyMaterial)
def get_material_details(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    material = crud.get_study_material(db, material_id=material_id, owner_id=current_user.id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    return material

@material_router.get("/{material_id}/download")
async def download_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    material = crud.get_study_material(db, material_id=material_id, owner_id=current_user.id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found or not authorized")
    file_on_disk = file_utils.MEDIA_ROOT / Path(material.file_path)
    if not file_on_disk.exists() or not file_on_disk.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")
    return FileResponse(path=str(file_on_disk), filename=material.file_name, media_type=material.file_type or 'application/octet-stream')

@material_router.put("/{material_id}", response_model=sm_schema.StudyMaterial)
def update_material_metadata(
    material_id: int,
    material_update: sm_schema.StudyMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    updated_material = crud.update_study_material(db, material_id=material_id, material_update=material_update, owner_id=current_user.id)
    if not updated_material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found or update failed")
    return updated_material

@material_router.delete("/{material_id}", response_model=sm_schema.StudyMaterial)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    deleted_material = crud.delete_study_material(db, material_id=material_id, owner_id=current_user.id)
    if not deleted_material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found or delete failed")
    
    check_and_grant_achievements(db, current_user, AchievementCriteriaType.STUDY_MATERIALS_UPLOADED_PER_SUBJECT)
    check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOTAL_MATERIALS_UPLOADED)
    
    return deleted_material





@material_router.get("/{material_id}/summary", response_model=sm_schema.MaterialSummaryResponse)
async def get_material_summary_route(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    material = crud.get_study_material(db, material_id, current_user.id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    # 1) Ak už máme súhrn v DB → vráť ho hneď
    if material.ai_summary or material.ai_summary_error:
        return sm_schema.MaterialSummaryResponse(
            material_id=material.id,
            file_name=material.file_name,
            summary=material.ai_summary,
            ai_error=material.ai_summary_error,
        )

    # 2) Ak nemáme `extracted_text`, nemôžeme súhrn vytvoriť
    if not material.extracted_text:
        return sm_schema.MaterialSummaryResponse(
            material_id=material.id,
            file_name=material.file_name,
            summary=None,
            ai_error="Text from this material has not been extracted or is empty.",
        )

    # 3) Zavolaj OpenAI
    ai = summarize_text_with_openai(material.extracted_text)

    # 4) Ulož do DB na budúce použitie
    material.ai_summary = ai.get("summary")
    material.ai_summary_error = ai.get("error")
    db.add(material)
    db.commit()
    db.refresh(material)

    return sm_schema.MaterialSummaryResponse(
        material_id=material.id,
        file_name=material.file_name,
        summary=material.ai_summary,
        ai_error=material.ai_summary_error,
    )


# helper na deserializáciu z DB textu ↦ list[str]
def _deserialize_tags(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        return json.loads(raw)
    except Exception:
        return [t.strip() for t in raw.split(",") if t.strip()]

@material_router.post("/{material_id}/generate-tags", response_model=list[str])
def generate_tags_for_material(
    material_id: int,
    force: bool = False,                          #  <-- NOVÉ
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    material = crud.get_study_material(db, material_id, current_user.id)
    if not material:
        raise HTTPException(404, "Materiál neexistuje alebo k nemáš prístup.")
    if not material.extracted_text:
        raise HTTPException(400, "Chýba extrahovaný text.")

    # ❶ už uložené tagy
    existing = _deserialize_tags(material.tags)
    if existing and not force:
        return existing

    # ❷ inak generujeme
    tags = extract_tags_from_text(material.extracted_text)
    if not crud.update_material_tags(db, material_id, tags):
        raise HTTPException(500, "Nepodarilo sa uložiť tagy.")
    return tags