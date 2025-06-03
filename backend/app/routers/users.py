# backend/app/routers/users.py
from fastapi import APIRouter, HTTPException, Depends, status # Pridaný status
from sqlalchemy.orm import Session
from typing import List # List tu nie je priamo použitý, ale môže byť pre iné endpointy

# NOVÉ IMPORTY
from ..database import get_db
from ..dependencies import get_current_active_user
from ..db import models as db_models # ORM modely
from ..schemas import user as user_schemas # Pydantic schémy pre používateľa
from ..crud import crud_user # CRUD operácie pre používateľa

router = APIRouter(
    prefix="/users", # Pridaj prefix tu pre konzistenciu
    tags=["users"]
)

@router.post("/", response_model=user_schemas.User, status_code=status.HTTP_201_CREATED)
def create_user_endpoint(user: user_schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud_user.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    return crud_user.create_user(db=db, user=user)

@router.get("/me", response_model=user_schemas.User)
async def read_users_me(current_user: db_models.User = Depends(get_current_active_user)):
    return current_user

@router.get("/{user_id}", response_model=user_schemas.User)
def read_user( # Tento endpoint by mal byť pravdepodobne chránený alebo len pre admina
    user_id: int, 
    db: Session = Depends(get_db),
    # current_user: db_models.User = Depends(get_current_active_user) # Ak by si chcel overiť práva
):
    # Ak current_user.id != user_id and not current_user.is_superuser:
    #     raise HTTPException(status_code=403, detail="Not authorized to access this user")
    db_user = crud_user.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return db_user