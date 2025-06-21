from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from typing import Optional, TYPE_CHECKING

from app.db.models.user import User as UserModel
from app.core.security import get_password_hash # verify_password tu nie je priamo použitý

if TYPE_CHECKING:
    from app.schemas.user import UserCreate, UserUpdate

def get_user(db: Session, user_id: int) -> Optional[UserModel]:
    return db.query(UserModel).filter(UserModel.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[UserModel]:
    return db.query(UserModel).filter(UserModel.email == email).first()

def create_user(db: Session, user_in: 'UserCreate') -> UserModel:
    hashed_password = get_password_hash(user_in.password)
    db_user_orm = UserModel(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name
    )
    db.add(db_user_orm)
    db.commit()
    db.refresh(db_user_orm)
    return db_user_orm

def update_user_profile(db: Session, db_user_orm_to_update: UserModel, user_update_payload: 'UserUpdate') -> UserModel:
    update_data = user_update_payload.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if hasattr(db_user_orm_to_update, field): # Kontrola, či atribút existuje
            setattr(db_user_orm_to_update, field, value if value is not None else getattr(db_user_orm_to_update, field))
            # Ak je hodnota None, môžeme buď nastaviť na None (ak DB povoľuje NULL)
            # alebo ponechať pôvodnú hodnotu. Tu ponechávame pôvodnú, ak je value None.
            # Ak chceš explicitne mazať (nastaviť na NULL), tak len: setattr(db_user_orm_to_update, field, value)

    db.add(db_user_orm_to_update)
    db.commit()
    db.refresh(db_user_orm_to_update)
    return db_user_orm_to_update



def get_user_by_reset_token(db: Session, token: str) -> Optional[UserModel]:
    return db.query(UserModel).filter(UserModel.reset_password_token == token).first()

def set_password_reset_token(db: Session, user: UserModel, token: str) -> UserModel:
    user.reset_password_token = token
    user.reset_password_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user_password(db: Session, user: UserModel, new_password: str) -> UserModel:
    user.hashed_password = get_password_hash(new_password)
    user.reset_password_token = None
    user.reset_password_token_expires_at = None
    db.add(user)
    db.commit()
    db.refresh(user)
    return user