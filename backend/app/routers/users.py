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



# NOVÉ ENDPOINTY
@router.post("/password-recovery", status_code=status.HTTP_202_ACCEPTED)
async def recover_password(
    payload: user_schema.PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = crud_user.get_user_by_email(db, email=payload.email)
    if user:
        token = secrets.token_urlsafe(32)
        crud_user.set_password_reset_token(db, user=user, token=token)
        background_tasks.add_task(
            send_password_reset_email,
            email_to=user.email,
            name=user.full_name,
            token=token
        )
    # Vždy vráť rovnakú odpoveď, aby si zabránil zisťovaniu existujúcich emailov
    return {"msg": "If an account with this email exists, a password reset link has been sent."}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    payload: user_schema.PasswordReset,
    db: Session = Depends(get_db)
):
    user = crud_user.get_user_by_reset_token(db, token=payload.token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token"
        )

    if user.reset_password_token_expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token has expired"
        )

    crud_user.update_user_password(db, user=user, new_password=payload.new_password)
    return {"msg": "Password updated successfully"}