from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import UploadFile
from pathlib import Path
import shutil

from app.db.models.study_material import StudyMaterial
from app.schemas.study_material import StudyMaterialCreate, StudyMaterialUpdate
from .crud_subject import get_subject
from app import file_utils

def create_study_material(
    db: Session,
    material_meta: StudyMaterialCreate,
    upload_file: UploadFile,
    subject_id: int,
    owner_id: int
) -> Optional[StudyMaterial]:
    
    db_subject = get_subject(db, subject_id=subject_id, owner_id=owner_id)
    if not db_subject:
        return None

    relative_file_path_str = str(file_utils.get_relative_file_path(owner_id, subject_id, upload_file.filename))
    full_destination_path = file_utils.get_full_path_on_disk(relative_file_path_str)
    
    existing_material = db.query(StudyMaterial).filter(
        StudyMaterial.subject_id == subject_id,
        StudyMaterial.owner_id == owner_id,
        StudyMaterial.file_path == relative_file_path_str
    ).first()
    if existing_material:
        return None 

    temp_file_path = full_destination_path.with_suffix(f"{full_destination_path.suffix}.tmp")
    file_size = 0
    try:
        file_utils.save_upload_file(upload_file, temp_file_path)
        file_size = temp_file_path.stat().st_size
        if file_size == 0 and upload_file.size is not None and upload_file.size > 0 : # Fallback ak stat zlyhá pre prázdny súbor
             file_size = upload_file.size
        elif file_size == 0 and (upload_file.size is None or upload_file.size == 0): # Ak je subor naozaj 0B alebo sa nepodarilo urcit velkost
             pass # Povolíme 0B súbory, ak je to zámer

        temp_file_path.rename(full_destination_path)
    except Exception as e:
        print(f"Error processing file {upload_file.filename}: {e}")
        if temp_file_path.exists():
            file_utils.remove_file_from_disk(temp_file_path)
        return None

    db_material_orm = StudyMaterial(
        title=material_meta.title,
        description=material_meta.description,
        material_type=material_meta.material_type,
        file_name=upload_file.filename,
        file_path=relative_file_path_str,
        file_type=upload_file.content_type,
        file_size=file_size, 
        subject_id=subject_id,
        owner_id=owner_id
    )
    db.add(db_material_orm)
    db.commit()
    db.refresh(db_material_orm)
    return db_material_orm

def get_study_material(db: Session, material_id: int, owner_id: int) -> Optional[StudyMaterial]:
    return db.query(StudyMaterial).filter(
        StudyMaterial.id == material_id,
        StudyMaterial.owner_id == owner_id
    ).first()

def get_study_materials_for_subject(db: Session, subject_id: int, owner_id: int) -> List[StudyMaterial]:
    db_subject = get_subject(db, subject_id=subject_id, owner_id=owner_id)
    if not db_subject:
        return []
    return sorted(db_subject.materials, key=lambda m: m.uploaded_at, reverse=True)

def update_study_material(
    db: Session,
    material_id: int,
    material_update: StudyMaterialUpdate,
    owner_id: int
) -> Optional[StudyMaterial]:
    db_material = get_study_material(db, material_id, owner_id)
    if not db_material:
        return None
    
    update_data = material_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_material, key, value)
    
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material

def delete_study_material(db: Session, material_id: int, owner_id: int) -> Optional[StudyMaterial]:
    db_material = get_study_material(db, material_id, owner_id)
    if not db_material:
        return None

    full_file_path_to_delete = file_utils.get_full_path_on_disk(db_material.file_path)
    file_utils.remove_file_from_disk(full_file_path_to_delete)
    
    # Ak by si chcel vrátiť Pydantic schému dát zmazaného objektu:
    # from app.schemas.study_material import StudyMaterial as StudyMaterialSchema
    # deleted_data_schema = StudyMaterialSchema.model_validate(db_material)
    
    db.delete(db_material)
    db.commit()
    return db_material # Alebo deleted_data_schema