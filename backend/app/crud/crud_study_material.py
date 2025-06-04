# backend/app/crud/crud_study_material.py
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import UploadFile
import shutil # Pre shutil.copyfileobj
from pathlib import Path

from app.db.models.study_material import StudyMaterial
# Ak get_subject je v crud_subject.py a StudyMaterialCreate je v schemas.study_material
from app.schemas.study_material import StudyMaterialCreate, StudyMaterialUpdate 
from .crud_subject import get_subject # Import z rovnakého adresára (crud)
from app import file_utils # Importuj náš modul

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

    # Relatívna cesta k súboru pre uloženie do DB
    relative_file_path_str = str(file_utils.get_file_path(owner_id, subject_id, upload_file.filename))
    # Plná cesta na disku pre uloženie súboru
    full_destination_path = file_utils.MEDIA_ROOT / Path(relative_file_path_str) # Konverzia na Path

    # Kontrola existencie (voliteľné, alebo premenovať súbor)
    existing_material = db.query(StudyMaterial).filter(
        StudyMaterial.subject_id == subject_id,
        StudyMaterial.owner_id == owner_id,
        StudyMaterial.file_path == relative_file_path_str
    ).first()
    if existing_material:
        print(f"File '{upload_file.filename}' already exists for this subject and user at '{relative_file_path_str}'. Upload aborted.")
        return None 

    # Uloženie súboru
    try:
        # Získanie veľkosti súboru - najprv uložíme do dočasného súboru, zistíme veľkosť, potom premenujeme
        temp_file_path = full_destination_path.with_suffix(f"{full_destination_path.suffix}.tmp")
        file_utils.save_upload_file(upload_file, temp_file_path) # Uloží do dočasného
        file_size = temp_file_path.stat().st_size
        temp_file_path.rename(full_destination_path) # Premenuj na finálny názov
    except Exception as e:
        print(f"Error saving file {upload_file.filename}: {e}")
        if temp_file_path.exists(): # Zmaž dočasný súbor v prípade chyby
            file_utils.remove_file(temp_file_path)
        return None

    db_material_orm = StudyMaterial(
        title=material_meta.title,
        description=material_meta.description,
        material_type=material_meta.material_type,
        file_name=upload_file.filename,
        file_path=relative_file_path_str, # Ukladáme relatívnu cestu
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
    # Overenie vlastníctva predmetu
    db_subject = get_subject(db, subject_id=subject_id, owner_id=owner_id)
    if not db_subject:
        return [] # Alebo hodiť chybu, ak predmet neexistuje/nepatrí používateľovi
    
    # Ak get_subject načíta db_subject.materials (napr. cez selectinload):
    # return sorted(db_subject.materials, key=lambda m: m.uploaded_at, reverse=True)
    # Alternatívne, priamy dopyt:
    return db.query(StudyMaterial).filter(
        StudyMaterial.subject_id == subject_id,
        StudyMaterial.owner_id == owner_id # Dvojitá kontrola vlastníctva
    ).order_by(StudyMaterial.uploaded_at.desc()).all()


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

    full_file_path_to_delete = file_utils.MEDIA_ROOT / Path(db_material.file_path)
    file_utils.remove_file(full_file_path_to_delete)
    
    # Ak by si chcel vrátiť dáta zmazaného objektu ako schému
    # from app.schemas.study_material import StudyMaterial as StudyMaterialSchema
    # deleted_data_schema = StudyMaterialSchema.model_validate(db_material)
    
    db.delete(db_material)
    db.commit()
    # Po commite je db_material detached, vrátenie ORM objektu je stále možné,
    # ale ak by response_model routera bol StudyMaterialSchema, FastAPI by sa postaralo o konverziu.
    # Ak by si chcel vrátiť Pydantic schému z tejto funkcie: return deleted_data_schema
    return db_material 