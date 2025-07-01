# backend/app/routers/study_materials.py
from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import crud, file_utils
from app.database import get_db
from app.db.enums import AchievementCriteriaType, MaterialTypeEnum
from app.db.models.user import User as UserModel
from app.dependencies import get_current_active_user
from app.schemas import study_material as sm_schema
from app.services.achievement_service import check_and_grant_achievements
from app.services.ai_service.materials_summary import (
    extract_tags_from_text,
    summarize_text_with_openai,
)

# --------------------------------------------------------------------------- #
# Routers                                                                     #
# --------------------------------------------------------------------------- #

router = APIRouter(
    prefix="/subjects/{subject_id}/materials",
    tags=["Study Materials (per Subject)"],
    dependencies=[Depends(get_current_active_user)],
)

material_router = APIRouter(
    prefix="/materials",
    tags=["Study Materials (general)"],
    dependencies=[Depends(get_current_active_user)],
)

# --------------------------------------------------------------------------- #
# Upload                                                                      #
# --------------------------------------------------------------------------- #


@router.post("/", response_model=sm_schema.StudyMaterial, status_code=status.HTTP_201_CREATED)
async def upload_material_to_subject(
    subject_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    material_type: Optional[MaterialTypeEnum] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    """POST /subjects/{id}/materials – uloží súbor + meta a vráti záznam."""
    meta = sm_schema.StudyMaterialCreate(title=title, description=description, material_type=material_type)
    obj = crud.create_study_material(
        db=db,
        material_meta=meta,
        upload_file=file,
        subject_id=subject_id,
        owner_id=current_user.id,
    )
    if not obj:
        raise HTTPException(400, "Failed to upload material.")

    # achievementy
    check_and_grant_achievements(db, current_user, AchievementCriteriaType.STUDY_MATERIALS_UPLOADED_PER_SUBJECT)
    check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOTAL_MATERIALS_UPLOADED)

    return obj


# --------------------------------------------------------------------------- #
# List / Detail                                                               #
# --------------------------------------------------------------------------- #


@router.get("/", response_model=List[sm_schema.StudyMaterial])
def get_materials_for_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
    tags: str | None = Query(
        None,
        description="Zoznam tagov oddelený čiarkou (bez #), napr. 'dejiny,biológia'"
    ),
):
    tag_list = [t.trim() for t in tags.split(",") if t.trim()] if tags else None
    mats = crud.get_study_materials_for_subject(db, subject_id, current_user.id, tag_list)
    if mats is None:
        raise HTTPException(404, "Subject not found or no materials.")
    return mats


@material_router.get("/{material_id}", response_model=sm_schema.StudyMaterial)
def get_material_details(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    mat = crud.get_study_material(db, material_id, current_user.id)
    if not mat:
        raise HTTPException(404, "Material not found")
    return mat


# --------------------------------------------------------------------------- #
# Download                                                                    #
# --------------------------------------------------------------------------- #


@material_router.get("/{material_id}/download")
def download_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    mat = crud.get_study_material(db, material_id, current_user.id)
    if not mat:
        raise HTTPException(404, "Material not found")

    fp: Path = file_utils.MEDIA_ROOT / Path(mat.file_path)
    if not fp.is_file():
        raise HTTPException(404, "File not found on server")

    return FileResponse(str(fp), filename=mat.file_name, media_type=mat.file_type or "application/octet-stream")


# --------------------------------------------------------------------------- #
# Update / Delete                                                             #
# --------------------------------------------------------------------------- #


@material_router.put("/{material_id}", response_model=sm_schema.StudyMaterial)
def update_material_metadata(
    material_id: int,
    patch: sm_schema.StudyMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    updated = crud.update_study_material(db, material_id, patch, current_user.id)
    if not updated:
        raise HTTPException(404, "Material not found or update failed")
    return updated


@material_router.delete("/{material_id}", response_model=sm_schema.StudyMaterial)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    deleted = crud.delete_study_material(db, material_id, current_user.id)
    if not deleted:
        raise HTTPException(404, "Material not found or delete failed")

    check_and_grant_achievements(db, current_user, AchievementCriteriaType.STUDY_MATERIALS_UPLOADED_PER_SUBJECT)
    check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOTAL_MATERIALS_UPLOADED)
    return deleted


# --------------------------------------------------------------------------- #
# AI - SUMMARY (GET)                                                          #
# --------------------------------------------------------------------------- #


@material_router.get("/{material_id}/summary", response_model=sm_schema.MaterialSummaryResponse)
def get_material_summary_route(
    material_id: int,
    force: bool | None = False,  # ?force=true => vynútime refresh
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    mat = crud.get_study_material(db, material_id, current_user.id)
    if not mat:
        raise HTTPException(404, "Material not found")

    word_count = len(mat.extracted_text.split()) if mat.extracted_text else 0

    # 1) už uložené → vráť (ak force == False)
    if (mat.ai_summary or mat.ai_summary_error) and not force:
        return sm_schema.MaterialSummaryResponse(
            material_id=mat.id,
            file_name=mat.file_name,
            summary=mat.ai_summary,
            ai_error=mat.ai_summary_error,
            word_count=word_count,
        )

    # 2) bez textu nevieme generovať
    if not mat.extracted_text:
        return sm_schema.MaterialSummaryResponse(
            material_id=mat.id,
            file_name=mat.file_name,
            summary=None,
            ai_error="Text from this material has not been extracted.",
            word_count=0,
        )

    # 3) OpenAI
    ai = summarize_text_with_openai(mat.extracted_text)

    # 4) uložíme do DB
    mat.ai_summary = ai.get("summary")
    mat.ai_summary_error = ai.get("error")
    db.add(mat)
    db.commit()
    db.refresh(mat)

    return sm_schema.MaterialSummaryResponse(
        material_id=mat.id,
        file_name=mat.file_name,
        summary=mat.ai_summary,
        ai_error=mat.ai_summary_error,
        word_count=word_count,
    )

# --------------------------------------------------------------------------- #
# AI - TAGS (POST)                                                            #
# --------------------------------------------------------------------------- #

# pomocná funkcia na JSON→list
def _deserialize_tags(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        return json.loads(raw)
    except Exception:
        return [t.strip() for t in raw.split(",") if t.strip()]


@material_router.get("/{material_id}/tags", response_model=list[str])
def fetch_material_tags(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    mat = crud.get_study_material(db, material_id, current_user.id)
    if not mat:
        raise HTTPException(404, "Material not found")
    return _deserialize_tags(mat.tags)


@material_router.post("/{material_id}/generate-tags", response_model=list[str])
def generate_tags_for_material(
    material_id: int,
    force: bool | None = False,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    mat = crud.get_study_material(db, material_id, current_user.id)
    if not mat:
        raise HTTPException(404, "Material not found")
    if not mat.extracted_text:
        raise HTTPException(400, "No extracted text for tagging.")

    # 1) už existujú
    existing = _deserialize_tags(mat.tags)
    if existing and not force:
        return existing

    # 2) OpenAI
    tags = extract_tags_from_text(mat.extracted_text)

    # 3) uloženie
    if not crud.update_material_tags(db, material_id, tags):
        raise HTTPException(500, "Failed to save tags.")
    return tags


@material_router.patch(
    "/{material_id}",
    response_model=sm_schema.StudyMaterial,
    summary="Uprav AI súhrn alebo tagy",
)
def patch_material(
    material_id: int,
    patch: sm_schema.StudyMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    """
    Umožni manuálnu úpravu `ai_summary` a/alebo `tags`.
    """
    mat = crud.get_study_material(db, material_id, current_user.id)
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    data = patch.model_dump(exclude_unset=True)
    # ak meníme tagy, uložíme JSON
    if "tags" in data:
        mat.tags = json.dumps(data.pop("tags"), ensure_ascii=False)
    # ak meníme summary
    if "ai_summary" in data:
        mat.ai_summary = data.pop("ai_summary")

    # ostatné polia (title, description, material_type) CRUD vie
    for k, v in data.items():
        setattr(mat, k, v)

    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat