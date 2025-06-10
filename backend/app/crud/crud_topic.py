# backend/app/crud/crud_topic.py
from sqlalchemy.orm import Session
from typing import List, Optional, TYPE_CHECKING

from app.db import models # Ak tento import funguje pre prístup k models.Topic atď.
from app.db.enums import TopicStatus # Priamy import enumu

if TYPE_CHECKING:
    from app.schemas.topic import TopicCreate, TopicUpdate # Použi správnu cestu k schémam

def get_topic(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    return db.query(models.Topic).join(models.Subject).filter(
        models.Topic.id == topic_id,
        models.Subject.owner_id == owner_id
    ).first()

def get_topics_by_subject(db: Session, subject_id: int, owner_id: int, skip: int = 0, limit: int = 1000) -> List[models.Topic]:
    from .crud_subject import get_subject # Lokálny import
    subject = get_subject(db, subject_id, owner_id)
    if not subject:
        return []
    # Predpokladáme, že subject.topics je už načítané vďaka eager loadingu v get_subject
    all_topics = sorted(subject.topics, key=lambda t: t.name) 
    return all_topics[skip : skip + limit]

def create_topic(db: Session, topic_in: 'TopicCreate', subject_id: int, owner_id: int) -> Optional[models.Topic]:
    from .crud_subject import get_subject # Lokálny import
    db_subject = get_subject(db, subject_id, owner_id)
    if not db_subject:
        return None
    
    topic_data = topic_in.model_dump()
    # Ak schéma TopicCreate má status ako Optional a defaultne ho nenastavuje,
    # a DB model má default, tak by sa mal použiť default z DB modelu.
    # Ak chceme explicitne nastaviť default tu, ak nie je poskytnutý:
    if topic_data.get('status') is None:
        topic_data['status'] = TopicStatus.NOT_STARTED
    
    db_topic_orm = models.Topic(**topic_data, subject_id=subject_id)
    db.add(db_topic_orm)
    db.commit()
    db.refresh(db_topic_orm)
    return db_topic_orm

def update_topic(db: Session, topic_id: int, topic_update: 'TopicUpdate', owner_id: int) -> Optional[models.Topic]:
    db_topic = get_topic(db, topic_id, owner_id) # get_topic nevolá get_subject, takže OK
    if not db_topic:
        return None
    update_data = topic_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_topic, key, value)
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

def delete_topic(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    db_topic = get_topic(db, topic_id, owner_id)
    if not db_topic:
        return None
    db.delete(db_topic)
    db.commit()
    return db_topic