# backend/app/routers/subjects.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/subjects",
    tags=["subjects"],
    dependencies=[Depends(get_current_active_user)] # Všetky endpointy tu budú chránené
)

@router.post("/", response_model=schemas.Subject, status_code=status.HTTP_201_CREATED)
def create_subject_for_user(
    subject: schemas.SubjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.create_subject(db=db, subject=subject, owner_id=current_user.id)

@router.get("/", response_model=List[schemas.Subject])
def read_subjects_for_user(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    subjects = crud.get_subjects_by_owner(db, owner_id=current_user.id, skip=skip, limit=limit)
    return subjects

@router.get("/{subject_id}", response_model=schemas.Subject)
def read_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_subject = crud.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if db_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return db_subject

@router.put("/{subject_id}", response_model=schemas.Subject)
def update_subject_for_user(
    subject_id: int,
    subject_update: schemas.SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    updated_subject = crud.update_subject(db, subject_id=subject_id, subject_update=subject_update, owner_id=current_user.id)
    if updated_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found or not authorized to update")
    return updated_subject

@router.delete("/{subject_id}", response_model=schemas.Subject) # Alebo len status_code=204 No Content
def delete_subject_for_user(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    deleted_subject = crud.delete_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if deleted_subject is None:
        raise HTTPException(status_code=404, detail="Subject not found or not authorized to delete")
    return deleted_subject # FastAPI vráti 200 OK s telom, ak je response_model definovaný
                           # Ak by si chcel 204, response_model by mal byť None a pridať status_code=status.HTTP_204_NO_CONTENT