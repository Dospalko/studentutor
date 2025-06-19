# backend/app/crud/crud_topic.py
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, TYPE_CHECKING

from app.db import models
from app.db.enums import TopicStatus
from app.services.topic_analyzer import update_topic_with_ai_analysis # Stále potrebujeme túto funkciu
from app.db.models.subject import Subject as SubjectModel # Pre načítanie materiálov predmetu
# from app.db.models.study_material import StudyMaterial as StudyMaterialModel # Ak by si materiály posielal priamo

if TYPE_CHECKING:
    from app.schemas.topic import TopicCreate, TopicUpdate

# Import get_subject z jeho modulu
from .crud_subject import get_subject 

def get_topic(db: Session, topic_id: int, owner_id: int, load_subject_with_materials: bool = False) -> Optional[models.Topic]:
    query = db.query(models.Topic).join(models.Subject).filter(
        models.Topic.id == topic_id,
        models.Subject.owner_id == owner_id
    )
    if load_subject_with_materials:
        # Načítaj predmet témy a zároveň materiály tohto predmetu
        query = query.options(
            selectinload(models.Topic.subject).selectinload(SubjectModel.materials)
        )
    else:
        query = query.options(selectinload(models.Topic.subject)) # Minimálne predmet
    return query.first()

def get_topics_by_subject(db: Session, subject_id: int, owner_id: int, skip: int = 0, limit: int = 1000) -> List[models.Topic]:
    subject = get_subject(db, subject_id, owner_id) # get_subject načíta aj témy
    if not subject:
        return []
    all_topics = sorted(subject.topics, key=lambda t: t.name) 
    return all_topics[skip : skip + limit]

def create_topic(db: Session, topic_in: 'TopicCreate', subject_id: int, owner_id: int) -> Optional[models.Topic]:
    db_subject = get_subject(db, subject_id, owner_id)
    if not db_subject:
        return None
    
    topic_data_dict = topic_in.model_dump()
    if topic_data_dict.get('status') is None:
        topic_data_dict['status'] = TopicStatus.NOT_STARTED
    
    # Pri vytváraní sa AI polia nenastavujú, budú None
    db_topic_orm = models.Topic(
        **topic_data_dict, 
        subject_id=subject_id,
        ai_difficulty_score=None,
        ai_estimated_duration=None
    )
        
    db.add(db_topic_orm)
    db.commit()
    db.refresh(db_topic_orm)
    return db_topic_orm

def update_topic(db: Session, topic_id: int, topic_update: 'TopicUpdate', owner_id: int) -> Optional[models.Topic]:
    db_topic_orm = get_topic(db, topic_id, owner_id) # Nepotrebujeme materiály pre bežný update
    if not db_topic_orm:
        return None
       
    update_data = topic_update.model_dump(exclude_unset=True)
    # Zabezpeč, aby sa AI polia neprepisovali na None, ak nie sú v payloade
    update_data.pop('ai_difficulty_score', None)
    update_data.pop('ai_estimated_duration', None)

    for key, value in update_data.items():
        setattr(db_topic_orm, key, value)
    
    db.add(db_topic_orm)
    db.commit()
    db.refresh(db_topic_orm)
    return db_topic_orm

def analyze_topic_and_save_estimates(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    # Načítaj tému spolu s jej predmetom a materiálmi predmetu pre AI analýzu
    db_topic_orm = get_topic(db, topic_id, owner_id, load_subject_with_materials=True)
    if not db_topic_orm:
        return None # Téma neexistuje alebo nepatrí používateľovi

    print(f"[CRUD Topic] Performing AI analysis for existing topic ID: {topic_id}")
    
    subject_materials = []
    if db_topic_orm.subject: # Ak je subject načítaný (čo by mal byť vďaka load_subject_with_materials)
        subject_materials = db_topic_orm.subject.materials # Predpokladá, že subject.materials sú tiež načítané

    update_topic_with_ai_analysis(db_topic_orm, db_materials=subject_materials)
    
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