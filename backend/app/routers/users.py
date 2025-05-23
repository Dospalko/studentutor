# backend/app/routers/users.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from .. import crud, schemas, models # models pre typovanie current_user
from ..database import get_db
from ..dependencies import get_current_active_user # Importujeme závislosť

router = APIRouter()

@router.post("/", response_model=schemas.User, status_code=201)
def create_user_endpoint(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    # Vďaka Depends(get_current_active_user) je tento endpoint chránený
    # a current_user je už načítaný a validovaný objekt užívateľa
    return current_user

# Príklad pre endpoint, ktorý by mal byť chránený, ale zatiaľ nie je
# (len na ukážku, neskôr pridáme ochranu)
@router.get("/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user