from datetime import timezone
import datetime
import secrets
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_active_user
from app.db.models.user import User as UserModel
from app.schemas import user as user_schema
from app.crud import crud_user
from app.core.email import send_password_reset_email
from app.schemas.study_material import StudyMaterial

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.post("/", response_model=user_schema.User, status_code=status.HTTP_201_CREATED)
def create_user_registration(
    user_payload: user_schema.UserCreate,
    db: Session = Depends(get_db)
):
    db_user = crud_user.get_user_by_email(db, email=user_payload.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    created_user_orm = crud_user.create_user(db=db, user_in=user_payload)
    return created_user_orm

@router.get("/me", response_model=user_schema.User, dependencies=[Depends(get_current_active_user)])
async def read_current_user_me(
    current_user_orm: UserModel = Depends(get_current_active_user)
):
    return current_user_orm

@router.put("/me", response_model=user_schema.User, dependencies=[Depends(get_current_active_user)])
def update_current_user_profile_info(
    user_update_data: user_schema.UserUpdate, # Prijíma dáta podľa UserUpdate
    db: Session = Depends(get_db),
    current_user_orm: UserModel = Depends(get_current_active_user)
):
    updated_user = crud_user.update_user_profile(
        db=db, 
        db_user_orm_to_update=current_user_orm, 
        user_update_payload=user_update_data
    )
    return updated_user

@router.get("/{user_id}", response_model=user_schema.User, dependencies=[Depends(get_current_active_user)])
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
):
    # Tu by mala byť logika oprávnení, či aktuálny používateľ môže vidieť tohto používateľa
    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return db_user


@router.get("/stats", summary="Moje štatistiky")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    # Celkový počet materiálov
    total_materials = db.query(StudyMaterial).filter(StudyMaterial.owner_id == current_user.id).count()

    # Koľko materiálov má už AI súhrn?
    total_summaries = db.query(StudyMaterial).filter(
        StudyMaterial.owner_id == current_user.id,
        StudyMaterial.ai_summary.isnot(None)
    ).count()

    # Koľko materiálov má už tagy?
    total_tagged = db.query(StudyMaterial).filter(
        StudyMaterial.owner_id == current_user.id,
        StudyMaterial.tags != "[]"
    ).count()

    # Objem textu (slová) zo všetkých extrahovaných textov
    texts = db.query(StudyMaterial.extracted_text).filter(
        StudyMaterial.owner_id == current_user.id,
        StudyMaterial.extracted_text.isnot(None)
    ).all()
    total_words = sum(len(t[0].split()) for t in texts if t[0])

    return {
        "total_materials": total_materials,
        "total_summaries": total_summaries,
        "total_tagged": total_tagged,
        "total_words": total_words,
    }