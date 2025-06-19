from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, TYPE_CHECKING

from app.db import models
from app.db.enums import TopicStatus
from app.db.models.subject import Subject as SubjectModel
from app.services.ai_service.topic_analyzer import update_topic_with_ai_analysis

if TYPE_CHECKING:
    from app.schemas.topic import TopicCreate, TopicUpdate

from .crud_subject import get_subject


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _get_topic_query(db: Session, topic_id: int, owner_id: int, load_materials: bool):
    query = (
        db.query(models.Topic)
        .join(models.Subject)
        .filter(models.Topic.id == topic_id, models.Subject.owner_id == owner_id)
    )
    if load_materials:
        query = query.options(
            selectinload(models.Topic.subject).selectinload(SubjectModel.materials)
        )
    else:
        query = query.options(selectinload(models.Topic.subject))
    return query


# --------------------------------------------------------------------------- #
# Public CRUD
# --------------------------------------------------------------------------- #
def get_topic(db: Session, topic_id: int, owner_id: int, load_subject_with_materials=False):
    return _get_topic_query(db, topic_id, owner_id, load_subject_with_materials).first()


def get_topics_by_subject(db: Session, subject_id: int, owner_id: int, skip=0, limit=1000):
    subject = get_subject(db, subject_id, owner_id)
    if not subject:
        return []
    return sorted(subject.topics, key=lambda t: t.name)[skip : skip + limit]


def create_topic(db: Session, topic_in: "TopicCreate", subject_id: int, owner_id: int):
    data = topic_in.model_dump()
    if data.get("status") is None:
        data["status"] = TopicStatus.NOT_STARTED

    db_topic = models.Topic(
        **data,
        subject_id=subject_id,
        ai_difficulty_score=None,
        ai_estimated_duration=None,
    )

    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic


def update_topic(db: Session, topic_id: int, topic_update: "TopicUpdate", owner_id: int):
    db_topic = get_topic(db, topic_id, owner_id)
    if not db_topic:
        return None

    update_data = topic_update.model_dump(exclude_unset=True)
    update_data.pop("ai_difficulty_score", None)
    update_data.pop("ai_estimated_duration", None)

    for key, val in update_data.items():
        setattr(db_topic, key, val)

    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic


def analyze_topic_and_save_estimates(db: Session, topic_id: int, owner_id: int):
    db_topic = get_topic(db, topic_id, owner_id, load_subject_with_materials=True)
    if not db_topic:
        return None

    subject_materials = db_topic.subject.materials if db_topic.subject else []
    update_topic_with_ai_analysis(db_topic, db_materials=subject_materials)

    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic


def delete_topic(db: Session, topic_id: int, owner_id: int):
    db_topic = get_topic(db, topic_id, owner_id)
    if not db_topic:
        return None
    db.delete(db_topic)
    db.commit()
    return db_topic
