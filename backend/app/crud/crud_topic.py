# backend/app/crud/crud_topic.py
from sqlalchemy.orm import Session
from typing import List, Optional, TYPE_CHECKING
from ..db import models
from .crud_subject import get_subject # Import CRUD funkcie pre subject
if TYPE_CHECKING:
      from ..schemas.topic import TopicCreate, TopicUpdate

def get_topic(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
      return db.query(models.Topic).join(models.Subject).filter(
          models.Topic.id == topic_id,
          models.Subject.owner_id == owner_id
      ).first()

def get_topics_by_subject(db: Session, subject_id: int, owner_id: int, skip: int = 0, limit: int = 1000) -> List[models.Topic]:
      subject = get_subject(db, subject_id, owner_id)
      if not subject:
          return []
      all_topics = sorted(subject.topics, key=lambda t: t.name) # Predpokladá, že get_subject načíta témy
      return all_topics[skip : skip + limit]

def create_topic(db: Session, topic: 'TopicCreate', subject_id: int, owner_id: int) -> Optional[models.Topic]:
      db_subject = get_subject(db, subject_id, owner_id)
      if not db_subject:
          return None
      topic_data = topic.model_dump()
      if topic_data.get('status') is None:
          topic_data['status'] = models.TopicStatus.NOT_STARTED # Použi enum z models
      
      db_topic = models.Topic(**topic_data, subject_id=subject_id)
      db.add(db_topic)
      db.commit()
      db.refresh(db_topic)
      return db_topic

def update_topic(db: Session, topic_id: int, topic_update: 'TopicUpdate', owner_id: int) -> Optional[models.Topic]:
      db_topic = get_topic(db, topic_id, owner_id)
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
      db.delete(db_topic) # CASCADE by malo zmazať StudyBlocks
      db.commit()
      return db_topic