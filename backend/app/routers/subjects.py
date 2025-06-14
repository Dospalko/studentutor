# backend/app/routers/subjects.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_active_user
from app.db import models as db_models
from app.schemas import subject as subject_schemas
from app.crud import crud_subject
from app.services.achievement_service import check_and_grant_achievements
from app.db.enums import AchievementCriteriaType

router = APIRouter(
    prefix="/subjects",
    tags=["Subjects"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=subject_schemas.Subject, status_code=status.HTTP_201_CREATED)
def create_subject_for_user(
    subject: subject_schemas.SubjectCreate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    created_subject_orm = crud_subject.create_subject(db=db, subject=subject, owner_id=current_user.id)
    
    check_and_grant_achievements(db, current_user, AchievementCriteriaType.SUBJECTS_CREATED)
    
    return created_subject_orm

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
    deleted_subject_orm = crud_subject.delete_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if deleted_subject_orm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not authorized to delete")
    
    # Po zmazaní prehodnoť achievementy, ktoré mohli byť ovplyvnené znížením počtu predmetov
    check_and_grant_achievements(db, current_user, AchievementCriteriaType.SUBJECTS_CREATED)
    # Tiež by to mohlo ovplyvniť achievementy viazané na témy a materiály, ak sú mazané kaskádovo
    check_and_grant_achievements(db, current_user) # Skontroluj všetky pre istotu
    
    return deleted_subject_orm