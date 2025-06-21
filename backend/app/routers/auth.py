# backend/app/routers/auth.py
import datetime
import secrets
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
# datetime a timedelta sú teraz použité v core.security.create_access_token

from app.schemas import user as user_schema
from app.database import get_db
# from app.config import settings # settings sa používajú v core.security
from app.schemas import token as token_schema # Alias pre schémy
from app.crud import crud_user
from app.core.security import verify_password, create_access_token
from app.core.email import send_password_reset_email # Importuj z core.security

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

    if user.reset_password_token_expires_at < datetime.now(datetime.timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token has expired"
        )

    crud_user.update_user_password(db, user=user, new_password=payload.new_password)
    return {"msg": "Password updated successfully"}