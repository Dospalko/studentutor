# backend/app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_active_user
from app.db.models.user import User as UserModel
from app.schemas import user as user_schema # napr. user_schema.User, user_schema.UserCreate
from app.crud import crud_user # napr. crud_user.create_user

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.post("/", response_model=user_schema.User, status_code=status.HTTP_201_CREATED)
def create_user_registration(
    user_payload: user_schema.UserCreate, # Názov parametra, ktorý prijíma telo požiadavky
    db: Session = Depends(get_db)
):
    db_user = crud_user.get_user_by_email(db, email=user_payload.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    # Volanie CRUD funkcie s pomenovaným argumentom 'user_in', ktorý teraz očakáva
    created_user_orm = crud_user.create_user(db=db, user_in=user_payload)
    return created_user_orm


@router.get("/me", response_model=user_schema.User, dependencies=[Depends(get_current_active_user)])
async def read_current_user_me(
    current_user_orm: UserModel = Depends(get_current_active_user)
):
    return current_user_orm


@router.get("/{user_id}", response_model=user_schema.User, dependencies=[Depends(get_current_active_user)])
def read_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
):
    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return db_user