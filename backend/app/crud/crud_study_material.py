"""
CRUD pre StudyMaterial.

• Zachované funkčné mená (create_study_material, …)
• Bezpečné transakcie a robustné mazanie súborov.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import List, Optional

from fastapi import UploadFile
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.models.study_material import StudyMaterial
from app.schemas.study_material import StudyMaterialCreate, StudyMaterialUpdate
from app.crud.crud_subject import get_subject
from app import file_utils

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# CREATE                                                                      #
# --------------------------------------------------------------------------- #
def create_study_material(
    db: Session,
    material_meta: StudyMaterialCreate,
    upload_file: UploadFile,
    subject_id: int,
    owner_id: int,
) -> Optional[StudyMaterial]:
    """
    • Uloží upload na disk (tmp → final).
    • Vloží záznam do DB.
    • Ak existuje duplicitná cesta, vráti None.
    """
    subject = get_subject(db, subject_id, owner_id)
    if not subject:
        return None

    rel_path = str(file_utils.get_relative_file_path(owner_id, subject_id, upload_file.filename))
    full_path: Path = file_utils.get_full_path_on_disk(rel_path)

    duplicate = (
        db.query(StudyMaterial)
        .filter(
            StudyMaterial.subject_id == subject_id,
            StudyMaterial.owner_id == owner_id,
            StudyMaterial.file_path == rel_path,
        )
        .first()
    )
    if duplicate:
        logger.warning("Material duplicate: %s", rel_path)
        return None

    tmp = full_path.with_suffix(full_path.suffix + ".tmp")

    try:
        file_utils.save_upload_file(upload_file, tmp)
        size = tmp.stat().st_size or (upload_file.size or 0)
        tmp.rename(full_path)

        obj = StudyMaterial(
            title=material_meta.title,
            description=material_meta.description,
            material_type=material_meta.material_type,
            file_name=upload_file.filename,
            file_path=rel_path,
            file_type=upload_file.content_type,
            file_size=size,
            subject_id=subject_id,
            owner_id=owner_id,
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Create material failed: %s", exc)
        file_utils.remove_file_from_disk(tmp)
        db.rollback()
        return None

# --------------------------------------------------------------------------- #
# READ                                                                        #
# --------------------------------------------------------------------------- #
def get_study_material(db: Session, material_id: int, owner_id: int) -> Optional[StudyMaterial]:
    return (
        db.query(StudyMaterial)
        .filter(StudyMaterial.id == material_id, StudyMaterial.owner_id == owner_id)
        .first()
    )


def get_study_materials_for_subject(db: Session, subject_id: int, owner_id: int) -> List[StudyMaterial]:
    subj = get_subject(db, subject_id, owner_id)
    return sorted(subj.materials, key=lambda m: m.uploaded_at, reverse=True) if subj else []

# --------------------------------------------------------------------------- #
# UPDATE                                                                      #
# --------------------------------------------------------------------------- #
def update_study_material(
    db: Session, material_id: int, material_update: StudyMaterialUpdate, owner_id: int
) -> Optional[StudyMaterial]:
    obj = get_study_material(db, material_id, owner_id)
    if not obj:
        return None

    for k, v in material_update.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)

    try:
        db.commit()
        db.refresh(obj)
        return obj
    except SQLAlchemyError as exc:
        logger.exception("Update material failed: %s", exc)
        db.rollback()
        return None

# --------------------------------------------------------------------------- #
# DELETE                                                                      #
# --------------------------------------------------------------------------- #
def delete_study_material(db: Session, material_id: int, owner_id: int) -> Optional[StudyMaterial]:
    obj = get_study_material(db, material_id, owner_id)
    if not obj:
        return None

    try:
        file_utils.remove_file_from_disk(file_utils.get_full_path_on_disk(obj.file_path))
        db.delete(obj)
        db.commit()
        return obj
    except SQLAlchemyError as exc:
        logger.exception("Delete material failed: %s", exc)
        db.rollback()
        return None
