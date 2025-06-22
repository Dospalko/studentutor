"""
CRUD pre Topic (AI analýza volaná manuálne).

Zachované funkcie:
    • get_topic
    • get_topics_by_subject
    • create_topic
    • update_topic
    • analyze_topic_and_save_estimates
    • delete_topic
"""

from __future__ import annotations

import logging
from typing import List, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.db import models
from app.db.enums import TopicStatus
from app.db.models.subject import Subject as SubjectModel
from app.services.ai_service.topic_analyzer import update_topic_with_ai_analysis
from app.crud.crud_subject import get_subject

logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------- #
# HELPERS                                                                     #
# --------------------------------------------------------------------------- #
def _topic_query(db: Session, topic_id: int, owner_id: int, with_materials: bool):
    q = (
        db.query(models.Topic)
        .join(models.Subject)
        .filter(models.Topic.id == topic_id, models.Subject.owner_id == owner_id)
    )
    if with_materials:
        q = q.options(selectinload(models.Topic.subject).selectinload(SubjectModel.materials))
    else:
        q = q.options(selectinload(models.Topic.subject))
    return q

# --------------------------------------------------------------------------- #
# READ                                                                        #
# --------------------------------------------------------------------------- #
def get_topic(db: Session, topic_id: int, owner_id: int, load_subject_with_materials=False):
    return _topic_query(db, topic_id, owner_id, load_subject_with_materials).first()


def get_topics_by_subject(db: Session, subject_id: int, owner_id: int, skip=0, limit=1000) -> List[models.Topic]:
    subj = get_subject(db, subject_id, owner_id)
    return sorted(subj.topics, key=lambda t: t.name)[skip : skip + limit] if subj else []

# --------------------------------------------------------------------------- #
# CREATE                                                                      #
# --------------------------------------------------------------------------- #
def create_topic(db: Session, topic_in, subject_id: int, owner_id: int) -> Optional[models.Topic]:
    data = topic_in.model_dump()
    data.setdefault("status", TopicStatus.NOT_STARTED)

    obj = models.Topic(**data, subject_id=subject_id, ai_difficulty_score=None, ai_estimated_duration=None)

    try:
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj
    except SQLAlchemyError as exc:
        logger.exception("Create topic failed: %s", exc)
        db.rollback()
        return None

# --------------------------------------------------------------------------- #
# UPDATE                                                                      #
# --------------------------------------------------------------------------- #
def update_topic(db: Session, topic_id: int, topic_update, owner_id: int) -> Optional[models.Topic]:
    obj = get_topic(db, topic_id, owner_id)
    if not obj:
        return None

    data = topic_update.model_dump(exclude_unset=True)
    data.pop("ai_difficulty_score", None)
    data.pop("ai_estimated_duration", None)

    for k, v in data.items():
        setattr(obj, k, v)

    try:
        db.commit()
        db.refresh(obj)
        return obj
    except SQLAlchemyError as exc:
        logger.exception("Update topic failed: %s", exc)
        db.rollback()
        return None

# --------------------------------------------------------------------------- #
# AI ANALÝZA                                                                  #
# --------------------------------------------------------------------------- #
def analyze_topic_and_save_estimates(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    obj = get_topic(db, topic_id, owner_id, load_subject_with_materials=True)
    if not obj:
        return None

    try:
        mats = obj.subject.materials if obj.subject else []
        update_topic_with_ai_analysis(obj, db_materials=mats)
        db.commit()
        db.refresh(obj)
        return obj
    except SQLAlchemyError as exc:
        logger.exception("AI analyze topic failed: %s", exc)
        db.rollback()
        return None

# --------------------------------------------------------------------------- #
# DELETE                                                                      #
# --------------------------------------------------------------------------- #
def delete_topic(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    obj = get_topic(db, topic_id, owner_id)
    if not obj:
        return None
    try:
        db.delete(obj)
        db.commit()
        return obj
    except SQLAlchemyError as exc:
        logger.exception("Delete topic failed: %s", exc)
        db.rollback()
        return None
