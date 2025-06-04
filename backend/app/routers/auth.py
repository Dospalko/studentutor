# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
# datetime a timedelta sú teraz použité v core.security.create_access_token

from app.database import get_db
# from app.config import settings # settings sa používajú v core.security
from app.schemas import token as token_schema # Alias pre schémy
from app.crud import crud_user
from app.core.security import verify_password, create_access_token # Importuj z core.security

router = APIRouter(
    prefix="/auth", # Pridaj prefix tu pre konzistenciu
    tags=["Authentication"] # Tag pre Swagger UI
)

@router.post("/token", response_model=token_schema.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud_user.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password): # Použi verify_password z core.security
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # create_access_token teraz berie expires_delta priamo, nie settings
    # access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES) # Toto už nie je potrebné tu
    access_token = create_access_token(data={"sub": user.email}) # expires_delta je voliteľný v create_access_token
    return {"access_token": access_token, "token_type": "bearer"}