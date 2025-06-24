# backend/app/crud/crud_study_material.py
import json
import logging # Pridaj logging
from pathlib import Path
from typing import List, Optional

from fastapi import UploadFile
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
import PyPDF2 # Import PyPDF2
import shutil # Pre shutil.copyfileobj

from app.db.models.study_material import StudyMaterial
from app.schemas.study_material import StudyMaterialCreate, StudyMaterialUpdate
from app.crud.crud_subject import get_subject # Predpokladáme správnu cestu
from app import file_utils
from app.db import models

logger = logging.getLogger(__name__)

def _extract_text_from_pdf(file_path_on_disk: Path) -> Optional[str]:
    """Extrahuj text z PDF súboru."""
    try:
        text = ""
        with file_path_on_disk.open("rb") as pdf_file_obj:
            pdf_reader = PyPDF2.PdfReader(pdf_file_obj)
            for page_num in range(len(pdf_reader.pages)):
                page_obj = pdf_reader.pages[page_num]
                page_text = page_obj.extract_text()
                if page_text: # extract_text môže vrátiť None
                    text += page_text + "\n" 
        logger.info("Successfully extracted text from PDF: %s", file_path_on_disk.name)
        return text.strip() if text.strip() else None
    except Exception as e:
        logger.error("Error extracting text from PDF %s: %s", file_path_on_disk.name, e, exc_info=True)
        return None

def _extract_text_from_txt(file_path_on_disk: Path) -> Optional[str]:
    """Extrahuj text z TXT súboru."""
    try:
        with file_path_on_disk.open("r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        logger.info("Successfully extracted text from TXT: %s", file_path_on_disk.name)
        return text.strip() if text.strip() else None
    except Exception as e:
        logger.error("Error extracting text from TXT %s: %s", file_path_on_disk.name, e, exc_info=True)
        return None

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


def extract_text_content_from_file(file_path_on_disk: Path, mime_type: Optional[str]) -> Optional[str]:
    """Zvolí správnu metódu extrakcie na základe MIME typu alebo koncovky."""
    effective_mime_type = mime_type
    if not effective_mime_type:
        suffix = file_path_on_disk.suffix.lower()
        if suffix == ".pdf": effective_mime_type = "application/pdf"
        elif suffix == ".txt": effective_mime_type = "text/plain"
        # elif suffix == ".docx": effective_mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            logger.warning("Unsupported file extension for text extraction: %s", suffix)
            return None
    
    if "pdf" in effective_mime_type:
        return _extract_text_from_pdf(file_path_on_disk)
    elif "text/plain" in effective_mime_type:
        return _extract_text_from_txt(file_path_on_disk)
    # elif "vnd.openxmlformats-officedocument.wordprocessingml.document" in effective_mime_type:
    #     return _extract_text_from_docx(file_path_on_disk)
    else:
        logger.warning("Unsupported MIME type for text extraction: %s", effective_mime_type)
        return None

def create_study_material(
    db: Session,
    material_meta: StudyMaterialCreate,
    upload_file: UploadFile,
    subject_id: int,
    owner_id: int,
) -> Optional[StudyMaterial]:
    subject = get_subject(db, subject_id, owner_id)
    if not subject:
        return None

    rel_path_str = str(file_utils.get_relative_file_path(owner_id, subject_id, upload_file.filename))
    full_path_on_disk: Path = file_utils.get_full_path_on_disk(rel_path_str)

    duplicate = db.query(StudyMaterial).filter(StudyMaterial.file_path == rel_path_str).first()
    if duplicate:
        logger.warning("Material duplicate at path: %s", rel_path_str)
        return None

    tmp_file_path = full_path_on_disk.with_suffix(full_path_on_disk.suffix + ".tmp")
    file_size = 0
    extracted_text: Optional[str] = None

    try:
        file_utils.save_upload_file(upload_file, tmp_file_path)
        file_size = tmp_file_path.stat().st_size

        # Extrahuj text po uložení do dočasného súboru
        extracted_text = extract_text_content_from_file(tmp_file_path, upload_file.content_type)
        
        tmp_file_path.rename(full_path_on_disk) # Až po úspešnej extrakcii premenuj

        obj = StudyMaterial(
            title=material_meta.title,
            description=material_meta.description,
            material_type=material_meta.material_type,
            file_name=upload_file.filename,
            file_path=rel_path_str,
            file_type=upload_file.content_type,
            file_size=file_size,
            extracted_text=extracted_text, # <<<< ULOŽENIE EXTRAHOVANÉHO TEXTU
            subject_id=subject_id,
            owner_id=owner_id,
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
    except Exception as exc:
        logger.exception("Create material or text extraction failed: %s", exc)
        if tmp_file_path.exists(): file_utils.remove_file_from_disk(tmp_file_path)
        if full_path_on_disk.exists() and not Path(rel_path_str).name == tmp_file_path.name : # Ak sa stihol premenovať pred chybou
             file_utils.remove_file_from_disk(full_path_on_disk)
        db.rollback()
        return None
    finally:
        # Uisti sa, že stream súboru je zatvorený, aj keď save_upload_file to už robí
        if not upload_file.file.closed:
            upload_file.file.close()


def _deserialize_tags(raw: str | None) -> list[str]:
    if raw is None:
        return []
    try:
        return json.loads(raw) if raw.startswith("[") else [t.strip() for t in raw.split(",") if t.strip()]
    except Exception:
        return []

def update_material_tags(db: Session, material_id: int, tags: list[str]) -> bool:
    obj = db.query(StudyMaterial).filter(StudyMaterial.id == material_id).first()
    if not obj:
        return False
    try:
        obj.tags = json.dumps(tags, ensure_ascii=False)
        db.add(obj)
        db.commit()
        return True
    except SQLAlchemyError as exc:
        logger.exception("Saving tags failed: %s", exc)
        db.rollback()
        return False
