# backend/app/crud/crud_topic.py
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, TYPE_CHECKING

from app.db import models # Používame app.db.models.Topic atď.
from app.db.enums import TopicStatus
from app.services.ai_service.topic_analyzer import update_topic_with_ai_analysis # Pre AI odhady
from app.db.models.subject import Subject as SubjectModel # Pre načítanie materiálov predmetu
from app.db.models.study_material import StudyMaterial as StudyMaterialModel # Pre načítanie materiálov predmetu


if TYPE_CHECKING:
    from app.schemas.topic import TopicCreate, TopicUpdate
    # Import get_subject len pre TYPE_CHECKING, aby sa predišlo cyklu, ak by ho volal aj iný CRUD
    from .crud_subject import get_subject 

def get_topic(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    return db.query(models.Topic).join(models.Subject).filter(
        models.Topic.id == topic_id,
        models.Subject.owner_id == owner_id
    ).first()

def get_topics_by_subject(db: Session, subject_id: int, owner_id: int, skip: int = 0, limit: int = 1000) -> List[models.Topic]:
    from .crud_subject import get_subject # Lokálny import pre beh funkcie
    subject = get_subject(db, subject_id, owner_id) # get_subject by mal načítať aj témy
    if not subject:
        return []
    
    # Ak get_subject načíta subject.topics (čo by mal s selectinload)
    all_topics = sorted(subject.topics, key=lambda t: t.name) 
    return all_topics[skip : skip + limit]

def create_topic(db: Session, topic_in: 'TopicCreate', subject_id: int, owner_id: int) -> Optional[models.Topic]:
    from .crud_subject import get_subject # Lokálny import
    db_subject = get_subject(db, subject_id, owner_id) # Mal by načítať aj db_subject.materials
    if not db_subject:
        return None
    
    topic_data_dict = topic_in.model_dump()
    if topic_data_dict.get('status') is None: # Pydantic modely by mali mať default, ale pre istotu
        topic_data_dict['status'] = TopicStatus.NOT_STARTED
    
    db_topic_orm = models.Topic(**topic_data_dict, subject_id=subject_id)
    
    # AI Analýza pri vytváraní témy
    # Použijeme materiály celého predmetu, keďže téma ešte nemá vlastné priradené materiály
    update_topic_with_ai_analysis(db_topic_orm, db_materials=db_subject.materials)
    
    db.add(db_topic_orm)
    db.commit()
    db.refresh(db_topic_orm)
    return db_topic_orm

def update_topic(db: Session, topic_id: int, topic_update: 'TopicUpdate', owner_id: int) -> Optional[models.Topic]:
    # Načítaj tému spolu s jej predmetom a materiálmi predmetu pre AI analýzu
    db_topic_orm = db.query(models.Topic).options(
        selectinload(models.Topic.subject).selectinload(SubjectModel.materials)
    ).filter(models.Topic.id == topic_id).first()

    if not db_topic_orm or db_topic_orm.subject.owner_id != owner_id:
        return None
       
    update_data = topic_update.model_dump(exclude_unset=True)
    needs_reestimation = False
    for key, value in update_data.items():
        setattr(db_topic_orm, key, value)
        if key in ["name", "user_strengths", "user_weaknesses", "user_difficulty"]:
            needs_reestimation = True
    
    if needs_reestimation:
        update_topic_with_ai_analysis(db_topic_orm, db_materials=db_topic_orm.subject.materials)

    db.add(db_topic_orm)
    db.commit()
    db.refresh(db_topic_orm)
    # Ak sa zmenil status na COMPLETED, router by mal zavolať check_and_grant_achievements
    return db_topic_orm

def delete_topic(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    # Pri mazaní témy sa ON DELETE CASCADE (ak je nastavené v DB modeli StudyBlock.topic_id)
    # postará o zmazanie prepojených študijných blokov.
    db_topic = get_topic(db, topic_id, owner_id)
    if not db_topic:
        return None
    
    # Ak by si chcel vrátiť dáta ako schému PRED zmazaním:
    # from app.schemas.topic import Topic as TopicSchema
    # deleted_topic_schema = TopicSchema.model_validate(db_topic)
    
    db.delete(db_topic)
    db.commit()
    # Po commite je db_topic 'detached'. Router vracia ORM objekt, FastAPI ho skonvertuje.
    # Ak by si chcel vrátiť schému: return deleted_topic_schema
    return db_topic 