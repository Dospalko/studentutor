# backend/app/dependencies.py
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt # type: ignore
from sqlalchemy.orm import Session
from pydantic import ValidationError

# NOVÉ IMPORTY
from .database import get_db        # Pre databázovú session
from .config import settings        # Pre SECRET_KEY a ALGORITHM

# Importuj ORM modely (napríklad User model pre typovanie)
from .db import models as db_models # Alias pre ORM modely

# Importuj Pydantic schémy (napríklad TokenData)
from .schemas import token as token_schemas # Alias pre schémy tokenu
# Ak by si potreboval User schému:
# from .schemas import user as user_schemas

# Importuj CRUD funkcie (napríklad get_user_by_email)
from .crud import crud_user # CRUD operácie pre používateľa


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token") # Predpokladám, že toto je správna cesta k login endpointu

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> db_models.User: # Návratový typ je teraz ORM model User
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: Optional[str] = payload.get("sub") # Optional z typing
        if email is None:
            raise credentials_exception
        # Použi schému TokenData
        token_data = token_schemas.TokenData(email=email)
    except (JWTError, ValidationError): # Pridaj ValidationError, ak by Pydantic zlyhal
        raise credentials_exception
    
    # Použi CRUD funkciu na nájdenie používateľa
    user = crud_user.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user # Vráti ORM model User

async def get_current_active_user(
    current_user: db_models.User = Depends(get_current_user) # Očakáva ORM model User
) -> db_models.User: # Vracia ORM model User
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user