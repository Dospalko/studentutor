# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

# NOVÉ IMPORTY
from ..database import get_db
from ..config import settings # Pre SECRET_KEY, ALGORITHM, atď.
from ..schemas import token as token_schemas # Alias pre Pydantic schémy tokenu
from ..crud import crud_user # Pre overenie používateľa a hesla
from ..core.security import verify_password # Ak si verify_password presunul do security.py
# Ak verify_password zostal v crud_user.py, tak:
# from ..crud.crud_user import verify_password # Alternatívne, ak je tam

from jose import jwt

router = APIRouter()

# Táto funkcia by ideálne bola v app.core.security, ale ak funguje tu, je to OK pre teraz
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str: # Pridaný Optional pre Python 3.9+
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


@router.post("/token", response_model=token_schemas.Token) # Použi alias
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # Použi funkciu z crud_user
    user = crud_user.get_user_by_email(db, email=form_data.username) 
    # Použi funkciu z core.security (alebo crud_user, ak je tam)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}