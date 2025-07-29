from __future__ import annotations
import asyncio, logging
from datetime import datetime, timedelta, date
from typing import Optional, Tuple, TYPE_CHECKING
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, joinedload, selectinload
from app.db import models
from app.db.enums import StudyPlanStatus, StudyBlockStatus, TopicStatus
from app.crud.crud_subject import get_subject
from app.services.ai_service.study_plan_generator import build_plan

if TYPE_CHECKING:
    from app.schemas.study_plan import StudyPlanUpdate, StudyBlockUpdate

log = logging.getLogger(__name__)

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

def _schedule_blocks(plan: models.StudyPlan, topics: list[models.Topic], start: date) -> None:
    d = start
    for t in topics:
        plan.study_blocks.append(
            models.StudyBlock(
                scheduled_at=datetime.combine(d, datetime.min.time()),
                duration_minutes=t.ai_estimated_duration or 60,
                status=StudyBlockStatus.PLANNED,
                topic_id=t.id,
            )
        )
        d += timedelta(days=2 if (t.ai_difficulty_score or 0.5) > 0.7 else 1)

async def _ai_fill(plan: models.StudyPlan, subject: models.Subject, daily_minutes: int = 120) -> bool:
    topics_dto = [
        dict(
            id=t.id,
            title=t.name,
            difficulty=float(t.ai_difficulty_score or 0.5),
            estMinutes=int(t.ai_estimated_duration or 60),
            prereqIds=[],
        )
        for t in subject.topics
        if t.status != TopicStatus.COMPLETED
    ]
    prefs = dict(dailyMinutes=daily_minutes, startISO=(date.today() + timedelta(days=1)).isoformat())
    ai_blocks = await build_plan(topics_dto, prefs)
    if not ai_blocks:
        return False
    for b in ai_blocks:
        plan.study_blocks.append(
            models.StudyBlock(
                scheduled_at=datetime.fromisoformat(b["dateISO"]),
                duration_minutes=b["duration"],
                status=StudyBlockStatus.PLANNED,
                topic_id=b["topicId"],
                notes="review" if b.get("isReview") else None,
            )
        )
    return True

def create_study_plan_with_blocks(
    db: Session,
    subject_id: int,
    owner_id: int,
    name: str | None = None,
    force_regenerate: bool = False,
    use_ai: bool = True,
) -> Tuple[Optional[models.StudyPlan], bool]:
    subject = get_subject(db, subject_id, owner_id)
    if not subject:
        return None, False
    try:
        existing = get_active_study_plan_for_subject(db, subject_id, owner_id)
        if existing and not force_regenerate:
            ids = {b.topic_id for b in existing.study_blocks}
            new_topics = [t for t in subject.topics if t.id not in ids and t.status != TopicStatus.COMPLETED]
            if new_topics:
                last = max((b.scheduled_at.date() for b in existing.study_blocks), default=date.today())
                _schedule_blocks(existing, new_topics, last + timedelta(days=1))
                db.commit()
                return get_study_plan(db, existing.id, owner_id), True
            return existing, False
        if existing:
            existing.status = StudyPlanStatus.ARCHIVED
            db.add(existing)
        plan = models.StudyPlan(
            name=name or f"Študijný plán pre {subject.name}",
            user_id=owner_id,
            subject_id=subject_id,
            status=StudyPlanStatus.ACTIVE,
        )
        db.add(plan)
        todo = [t for t in subject.topics if t.status != TopicStatus.COMPLETED]
        if not (use_ai and asyncio.run(_ai_fill(plan, subject))):

            _schedule_blocks(plan, sorted(todo, key=lambda x: x.ai_difficulty_score or 0.5), date.today() + timedelta(days=1))
        db.commit()
        db.refresh(plan)
        return plan, True
    except SQLAlchemyError as e:
        db.rollback()
        log.exception("plan create failed %s", e)
        return None, False

def update_study_plan(db: Session, study_plan_id: int, plan_update: 'StudyPlanUpdate', owner_id: int):
    plan = get_study_plan(db, study_plan_id, owner_id)
    if not plan:
        return None
    for k, v in plan_update.model_dump(exclude_unset=True).items():
        setattr(plan, k, v)
    try:
        db.commit()
        db.refresh(plan)
        return plan
    except SQLAlchemyError:
        db.rollback()
        return None

def get_study_block(db: Session, study_block_id: int, owner_id: int) -> Optional[models.StudyBlock]:
    return (
        db.query(models.StudyBlock)
        .join(models.StudyPlan)
        .filter(models.StudyBlock.id == study_block_id, models.StudyPlan.user_id == owner_id)
        .options(joinedload(models.StudyBlock.topic))
        .first()
    )

def update_study_block(db: Session, study_block_id: int, block_update: 'StudyBlockUpdate', owner_id: int):
    block = get_study_block(db, study_block_id, owner_id)
    if not block:
        return None
    for k, v in block_update.model_dump(exclude_unset=True).items():
        setattr(block, k, v)
    if block_update.status == StudyBlockStatus.COMPLETED and block.topic:
        block.topic.status = TopicStatus.COMPLETED
    try:
        db.commit()
        db.refresh(block)
        return block
    except SQLAlchemyError:
        db.rollback()
        return None
