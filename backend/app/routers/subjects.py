# backend/app/routers/subjects.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# NOVÉ IMPORTY
from ..database import get_db
from ..dependencies import get_current_active_user
from ..db import models as db_models # ORM modely
from ..schemas import subject as subject_schemas # Pydantic schémy pre predmety
from ..crud import crud_subject # CRUD operácie pre predmety

router = APIRouter(
    prefix="/subjects",
    tags=["subjects"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=subject_schemas.Subject, status_code=status.HTTP_201_CREATED)
def create_subject_for_user(
    subject: subject_schemas.SubjectCreate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    return crud_subject.create_subject(db=db, subject=subject, owner_id=current_user.id)

@router.get("/", response_model=List[subject_schemas.Subject])
def read_subjects_for_user(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    subjects = crud_subject.get_subjects_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return subjects

@router.get("/{subject_id}", response_model=subject_schemas.Subject)
def read_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    db_subject = crud_subject.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if db_subject is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    return db_subject

@router.put("/{subject_id}", response_model=subject_schemas.Subject)
def update_subject_for_user(
    subject_id: int,
    subject_update: subject_schemas.SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    updated_subject = crud_subject.update_subject(db, subject_id=subject_id, subject_update=subject_update, owner_id=current_user.id)
    if updated_subject is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not authorized to update")
    return updated_subject

@router.delete("/{subject_id}", response_model=subject_schemas.Subject) 
def delete_subject_for_user(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    # CRUD funkcia by mala vrátiť ORM objekt zmazaného predmetu
    deleted_subject_orm = crud_subject.delete_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if deleted_subject_orm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not authorized to delete")
    return deleted_subject_orm