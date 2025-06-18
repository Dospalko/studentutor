# backend/app/crud/crud_topic.py
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, TYPE_CHECKING, Tuple

from app.db import models
from app.db.enums import TopicStatus
from app.services.ai_service.topic_analyzer import update_topic_with_ai_analysis # Pre AI odhady
from app.db.models.subject import Subject as SubjectModel
from app.db.models.study_material import StudyMaterial as StudyMaterialModel


if TYPE_CHECKING:
    from app.schemas.topic import TopicCreate, TopicUpdate
    from .crud_subject import get_subject 

from .crud_subject import get_subject # Lokálny import pre beh funkcie

def get_topic(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    return db.query(models.Topic).join(models.Subject).filter(
        models.Topic.id == topic_id,
        models.Subject.owner_id == owner_id
    ).options(
        selectinload(models.Topic.subject) # Načítaj aj predmet témy pre prípadné potreby
    ).first()

def get_topics_by_subject(db: Session, subject_id: int, owner_id: int, skip: int = 0, limit: int = 1000) -> List[models.Topic]:
    subject = get_subject(db, subject_id, owner_id)
    if not subject:
        return []
    all_topics = sorted(subject.topics, key=lambda t: t.name) 
    return all_topics[skip : skip + limit]

def create_topic(db: Session, topic_in: 'TopicCreate', subject_id: int, owner_id: int) -> Optional[models.Topic]:
    db_subject = get_subject(db, subject_id, owner_id) # Mal by načítať aj db_subject.materials
    if not db_subject:
        return None
    
    topic_data_dict = topic_in.model_dump()
    if topic_data_dict.get('status') is None:
        topic_data_dict['status'] = TopicStatus.NOT_STARTED
    
    db_topic_orm = models.Topic(**topic_data_dict, subject_id=subject_id)
    
    # AI Analýza sa vykoná VŽDY pri vytváraní novej témy
    print(f"[CRUD Topic] Performing AI analysis for new topic: {db_topic_orm.name}")
    update_topic_with_ai_analysis(db_topic_orm, db_materials=db_subject.materials) 
    
    db.add(db_topic_orm)
    db.commit()
    db.refresh(db_topic_orm)
    return db_topic_orm

def update_topic(db: Session, topic_id: int, topic_update: 'TopicUpdate', owner_id: int) -> Optional[models.Topic]:
    db_topic_orm = get_topic(db, topic_id, owner_id) # get_topic už načíta aj subject
    if not db_topic_orm:
        return None
       
    update_data = topic_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_topic_orm, key, value)
    
    # AI Analýza sa pri bežnej aktualizácii NEVYKONÁVA automaticky.
    # Ak by si chcel tlačidlo "Prepočítať AI odhady", vytvoril by si samostatný endpoint,
    # ktorý by zavolal napr. túto časť kódu:
    #
    # if "trigger_ai_recalculation" in update_data and update_data["trigger_ai_recalculation"]:
    #     print(f"[CRUD Topic] Triggering AI re-analysis for topic ID: {topic_id}")
    #     # Načítaj materiály predmetu, ak ich potrebuješ pre analýzu
    #     subject_materials = []
    #     if db_topic_orm.subject: # Ak je subject načítaný
    #         subject_materials = db_topic_orm.subject.materials # Predpokladá, že subject.materials sú načítané
    #     elif db_topic_orm.subject_id: # Ak nie, skús načítať subject a jeho materiály
    #         temp_subject = db.query(SubjectModel).options(selectinload(SubjectModel.materials)).filter(SubjectModel.id == db_topic_orm.subject_id).first()
    #         if temp_subject:
    #             subject_materials = temp_subject.materials
    #     update_topic_with_ai_analysis(db_topic_orm, db_materials=subject_materials)

    db.add(db_topic_orm)
    db.commit()
    db.refresh(db_topic_orm)
    return db_topic_orm

def delete_topic(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    db_topic = get_topic(db, topic_id, owner_id)
    if not db_topic:
        return None
    db.delete(db_topic)
    db.commit()
    return db_topic