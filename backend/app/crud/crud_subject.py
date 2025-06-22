"""
CRUD pre Subject 
"""

from __future__ import annotations

import logging
from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.db import models
from app.crud.crud_user import get_user
from app.services.achievement_service import check_and_grant_achievements

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# READ                                                                        #
# --------------------------------------------------------------------------- #
def get_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.Subject]:
    return (
        db.query(models.Subject)
        .filter(models.Subject.id == subject_id, models.Subject.owner_id == owner_id)
        .options(selectinload(models.Subject.topics), selectinload(models.Subject.materials))
        .first()
    )


def get_subjects_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Subject]:
    return (
        db.query(models.Subject)
        .filter(models.Subject.owner_id == owner_id)
        .order_by(models.Subject.name)
        .offset(skip)
        .limit(limit)
        .all()
    )

# --------------------------------------------------------------------------- #
# CREATE                                                                      #
# --------------------------------------------------------------------------- #
def create_subject(db: Session, subject, owner_id: int) -> Optional[models.Subject]:
    obj = models.Subject(**subject.model_dump(), owner_id=owner_id)
    try:
        db.add(obj)
        db.commit()
        db.refresh(obj)

        if (user := get_user(db, owner_id)):
            check_and_grant_achievements(db, user)
        return obj
    except SQLAlchemyError as exc:
        logger.exception("Create subject failed: %s", exc)
        db.rollback()
        return None

# --------------------------------------------------------------------------- #
# UPDATE                                                                      #
# --------------------------------------------------------------------------- #
def update_subject(db: Session, subject_id: int, payload, owner_id: int) -> Optional[models.Subject]:
    obj = get_subject(db, subject_id, owner_id)
    if not obj:
        return None

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)

    try:
        db.commit()
        db.refresh(obj)
        return obj
    except SQLAlchemyError as exc:
        logger.exception("Update subject failed: %s", exc)
        db.rollback()
        return None

# --------------------------------------------------------------------------- #
# DELETE                                                                      #
# --------------------------------------------------------------------------- #
def delete_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.Subject]:
    obj = get_subject(db, subject_id, owner_id)
    if not obj:
        return None
    try:
        db.delete(obj)
        db.commit()
        return obj
    except SQLAlchemyError as exc:
        logger.exception("Delete subject failed: %s", exc)
        db.rollback()
        return None
