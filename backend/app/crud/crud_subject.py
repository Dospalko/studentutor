# backend/app/crud/crud_subject.py
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, TYPE_CHECKING

# Importuj ORM modely správne
from app.db import models  # Alebo from app.db.models.subject import Subject (ak SubjectModel nie je alias)

# Importuj ostatné CRUD moduly a servisy pomocou absolútneho importu od 'app'
from app.crud import crud_user  # <--- OPRAVENÝ IMPORT (ak crud_user je v app/crud/__init__.py)
                                # ALEBO from .crud_user import get_user (ak je v tom istom adresári)
from app.services.achievement_service import check_and_grant_achievements # <--- OPRAVENÝ IMPORT

if TYPE_CHECKING:
    # Importuj Pydantic schémy správne
    from app.schemas.subject import SubjectCreate, SubjectUpdate

def get_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.Subject]:
    return db.query(models.Subject).filter(
        models.Subject.id == subject_id,
        models.Subject.owner_id == owner_id
    ).options(selectinload(models.Subject.topics), selectinload(models.Subject.materials)).first() # Pridal som aj materials

def get_subjects_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Subject]:
    return db.query(models.Subject).filter(models.Subject.owner_id == owner_id).order_by(models.Subject.name).offset(skip).limit(limit).all()

def create_subject(db: Session, subject: 'SubjectCreate', owner_id: int) -> models.Subject:
    db_subject_orm = models.Subject(**subject.model_dump(), owner_id=owner_id)
    db.add(db_subject_orm)
    db.commit()
    db.refresh(db_subject_orm)
    
    user_orm = crud_user.get_user(db, user_id=owner_id) 
    if user_orm:
        check_and_grant_achievements(db, user_orm)
        
    return db_subject_orm

def update_subject(db: Session, subject_id: int, subject_update: 'SubjectUpdate', owner_id: int) -> Optional[models.Subject]:
    db_subject = get_subject(db, subject_id, owner_id)
    if not db_subject:
        return None
    update_data = subject_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subject, key, value)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

def delete_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.Subject]:
    db_subject = get_subject(db, subject_id, owner_id)
    if not db_subject:
        return None
    db.delete(db_subject)
    db.commit()
    return db_subject