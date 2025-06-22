"""
CRUD pre User.

"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.models.user import User as UserModel
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# READ                                                                        #
# --------------------------------------------------------------------------- #
def get_user(db: Session, user_id: int) -> Optional[UserModel]:
    return db.query(UserModel).filter(UserModel.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[UserModel]:
    return db.query(UserModel).filter(UserModel.email == email).first()

# --------------------------------------------------------------------------- #
# CREATE                                                                      #
# --------------------------------------------------------------------------- #
def create_user(db: Session, user_in) -> Optional[UserModel]:
    try:
        obj = UserModel(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
        )
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
    except SQLAlchemyError as exc:
        logger.exception("Create user failed: %s", exc)
        db.rollback()
        return None

# --------------------------------------------------------------------------- #
# UPDATE – PROFIL                                                             #
# --------------------------------------------------------------------------- #
def update_user_profile(db: Session, db_user: UserModel, user_update) -> Optional[UserModel]:
    for k, v in user_update.model_dump(exclude_unset=True).items():
        if hasattr(db_user, k) and v is not None:
            setattr(db_user, k, v)

    try:
        db.commit()
        db.refresh(db_user)
        return db_user
    except SQLAlchemyError as exc:
        logger.exception("Update user profile failed: %s", exc)
        db.rollback()
        return None

# --------------------------------------------------------------------------- #
# PASSWORD RESET                                                              #
# --------------------------------------------------------------------------- #
def get_user_by_reset_token(db: Session, token: str) -> Optional[UserModel]:
    return db.query(UserModel).filter(UserModel.reset_password_token == token).first()


def set_password_reset_token(db: Session, user: UserModel, token: str) -> Optional[UserModel]:
    user.reset_password_token = token
    user.reset_password_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    try:
        db.commit()
        db.refresh(user)
        return user
    except SQLAlchemyError as exc:
        logger.exception("Set reset token failed: %s", exc)
        db.rollback()
        return None


def update_user_password(db: Session, user: UserModel, new_password: str) -> Optional[UserModel]:
    user.hashed_password = get_password_hash(new_password)
    user.reset_password_token = None
    user.reset_password_token_expires_at = None
    try:
        db.commit()
        db.refresh(user)
        return user
    except SQLAlchemyError as exc:
        logger.exception("Update password failed: %s", exc)
        db.rollback()
        return None
