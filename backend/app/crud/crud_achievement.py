"""
CRUD operácie pre Achievement a UserAchievement.

• Funkčné API (mená nezmenené) ostáva zachované.
• SQLAlchemy chyby sa logujú a vracia sa bezpečná default hodnota.
"""

from __future__ import annotations

import logging
from typing import List

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app.db.models.achievement import Achievement
from app.db.models.user_achievement import UserAchievement

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# READ                                                                        #
# --------------------------------------------------------------------------- #
def get_all_defined_achievements(db: Session) -> List[Achievement]:
    """Vráti všetky achievementy abecedne."""
    try:
        return db.query(Achievement).order_by(Achievement.name).all()
    except SQLAlchemyError as exc:
        logger.exception("Fetch achievements failed: %s", exc)
        return []


def get_user_achievements(db: Session, user_id: int) -> List[UserAchievement]:
    """Vráti achievementy používateľa, najnovšie hore."""
    try:
        return (
            db.query(UserAchievement)
            .filter(UserAchievement.user_id == user_id)
            .options(joinedload(UserAchievement.achievement))
            .order_by(UserAchievement.achieved_at.desc())
            .all()
        )
    except SQLAlchemyError as exc:
        logger.exception("Fetch user achievements failed: %s", exc)
        return []

# --------------------------------------------------------------------------- #
# CREATE (helper – ak inde neudieľate)                                        #
# --------------------------------------------------------------------------- #
def _grant_achievement(db: Session, user_id: int, ach_id: int) -> UserAchievement | None:
    """Idempotentne pridelí achievement užívateľovi."""
    try:
        existing = (
            db.query(UserAchievement)
            .filter(
                UserAchievement.user_id == user_id,
                UserAchievement.achievement_id == ach_id,
            )
            .first()
        )
        if existing:
            return existing

        ua = UserAchievement(user_id=user_id, achievement_id=ach_id)
        db.add(ua)
        db.commit()
        db.refresh(ua)
        return ua
    except SQLAlchemyError as exc:
        logger.exception("Grant achievement failed: %s", exc)
        db.rollback()
        return None
