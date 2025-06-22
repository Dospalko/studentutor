"""
CRUD + plánovač študijných plánov.

Zostali pôvodné funkcie:
    • get_study_plan
    • get_active_study_plan_for_subject
    • create_study_plan_with_blocks
    • update_study_plan
    • get_study_block
    • update_study_block

Refaktor:
    • robustné logovanie + rollback pri chybách.
    • generovanie blokov presunuté do _schedule_blocks.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import List, Optional, TYPE_CHECKING, Tuple

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload, selectinload

from app.db import models
from app.db.enums import StudyPlanStatus, StudyBlockStatus, TopicStatus
from app.crud.crud_subject import get_subject

if TYPE_CHECKING:  # importy len pre type-checker
    from app.schemas.study_plan import StudyPlanUpdate, StudyBlockUpdate

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# READ                                                                        #
# --------------------------------------------------------------------------- #
def get_study_plan(db: Session, study_plan_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    return (
        db.query(models.StudyPlan)
        .filter(models.StudyPlan.id == study_plan_id, models.StudyPlan.user_id == owner_id)
        .options(
            selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic),
            joinedload(models.StudyPlan.subject),
        )
        .first()
    )


def get_active_study_plan_for_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    return (
        db.query(models.StudyPlan)
        .filter(
            models.StudyPlan.subject_id == subject_id,
            models.StudyPlan.user_id == owner_id,
            models.StudyPlan.status == StudyPlanStatus.ACTIVE,
        )
        .options(
            selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic),
            joinedload(models.StudyPlan.subject),
        )
        .first()
    )

# --------------------------------------------------------------------------- #
# HELPERS                                                                     #
# --------------------------------------------------------------------------- #
def _schedule_blocks(
    study_plan: models.StudyPlan, topics: list[models.Topic], start_date: datetime.date
) -> None:
    """
    Naplánuje študijné bloky pre dané témy podľa AI náročnosti
    (ťažšie témy nechávajú 2-denný rozostup).
    """
    date_ptr = start_date
    for t in topics:
        duration = t.ai_estimated_duration or 60
        study_plan.study_blocks.append(
            models.StudyBlock(
                scheduled_at=datetime.combine(date_ptr, datetime.min.time()),
                duration_minutes=duration,
                status=StudyBlockStatus.PLANNED,
                topic_id=t.id,
            )
        )
        step = 2 if (t.ai_difficulty_score or 0.5) > 0.7 else 1
        date_ptr += timedelta(days=step)

# --------------------------------------------------------------------------- #
# CREATE                                                                      #
# --------------------------------------------------------------------------- #
def create_study_plan_with_blocks(
    db: Session,
    subject_id: int,
    owner_id: int,
    name: str | None = None,
    force_regenerate: bool = False,
) -> Tuple[Optional[models.StudyPlan], bool]:
    """
    Vytvorí (alebo aktualizuje) študijný plán a vráti (plan, was_new).

    • Ak existuje aktívny plán a `force_regenerate` == False → doplní len nové témy.
    • `force_regenerate` = True → starý deaktivuje, vytvorí nový.
    """
    subject = get_subject(db, subject_id, owner_id)
    if not subject:
        return None, False

    try:
        existing = get_active_study_plan_for_subject(db, subject_id, owner_id)
        was_new = False

        # --------------------------------------------------------------- #
        # 1️⃣  len doplniť nové témy do existujúceho plánu                #
        # --------------------------------------------------------------- #
        if existing and not force_regenerate:
            planned_ids = {b.topic_id for b in existing.study_blocks}
            to_add = [t for t in subject.topics if t.id not in planned_ids and t.status != TopicStatus.COMPLETED]

            if to_add:
                was_new = True
                last_date = max(
                    (b.scheduled_at.date() for b in existing.study_blocks),
                    default=datetime.utcnow().date(),
                )
                _schedule_blocks(existing, to_add, last_date + timedelta(days=1))
                db.commit()
            return get_study_plan(db, existing.id, owner_id), was_new

        # --------------------------------------------------------------- #
        # 2️⃣  pregenerovanie – archivuj starý, priprav nový              #
        # --------------------------------------------------------------- #
        if existing and force_regenerate:
            existing.status = StudyPlanStatus.ARCHIVED
            db.add(existing)

        name_base = name or f"Študijný plán pre {subject.name}"
        plan = models.StudyPlan(
            name=name_base if not existing else f"{name_base} (nový)",
            user_id=owner_id,
            subject_id=subject_id,
            status=StudyPlanStatus.ACTIVE,
        )
        db.add(plan)

        todo_topics = sorted(
            [t for t in subject.topics if t.status != TopicStatus.COMPLETED],
            key=lambda x: x.ai_difficulty_score or 0.5,
        )
        _schedule_blocks(plan, todo_topics, datetime.utcnow().date() + timedelta(days=1))
        db.commit()
        db.refresh(plan)
        return plan, True
    except SQLAlchemyError as exc:
        logger.exception("Create study plan failed: %s", exc)
        db.rollback()
        return None, False

# --------------------------------------------------------------------------- #
# UPDATE                                                                      #
# --------------------------------------------------------------------------- #
def update_study_plan(db: Session, study_plan_id: int, plan_update: 'StudyPlanUpdate', owner_id: int):
    plan = get_study_plan(db, study_plan_id, owner_id)
    if not plan:
        return None

    for k, v in plan_update.model_dump(exclude_unset=True).items():
        setattr(plan, k, v)
    try:
        db.commit()
        db.refresh(plan)
        return get_study_plan(db, plan.id, owner_id)
    except SQLAlchemyError as exc:
        logger.exception("Update study plan failed: %s", exc)
        db.rollback()
        return None

# --------------------------------------------------------------------------- #
# STUDY BLOCKS                                                                #
# --------------------------------------------------------------------------- #
def get_study_block(db: Session, study_block_id: int, owner_id: int) -> Optional[models.StudyBlock]:
    return (
        db.query(models.StudyBlock)
        .join(models.StudyPlan)
        .filter(models.StudyBlock.id == study_block_id, models.StudyPlan.user_id == owner_id)
        .options(joinedload(models.StudyBlock.topic))
        .first()
    )


def update_study_block(
    db: Session, study_block_id: int, block_update: 'StudyBlockUpdate', owner_id: int
) -> Optional[models.StudyBlock]:
    block = get_study_block(db, study_block_id, owner_id)
    if not block:
        return None

    update_data = block_update.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(block, k, v)

    # Ak sa blok dokončil → prepnúť status témy na COMPLETED
    if update_data.get("status") == StudyBlockStatus.COMPLETED and block.topic:
        block.topic.status = TopicStatus.COMPLETED

    try:
        db.commit()
        db.refresh(block)
        if block.topic:
            db.refresh(block.topic)
        return block
    except SQLAlchemyError as exc:
        logger.exception("Update study block failed: %s", exc)
        db.rollback()
        return None
