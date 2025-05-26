# backend/app/crud.py
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func # Pre agregácie, ak by boli potrebné
from . import models, schemas
from passlib.context import CryptContext
from typing import List, Optional
from datetime import datetime, timedelta # Pre prácu s dátumami pri generovaní plánu

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Password utils (zostávajú) ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- User CRUD (zostávajú) ---
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Subject CRUD ---
def get_subject(db: Session, subject_id: int, owner_id: int):
    return db.query(models.Subject).filter(models.Subject.id == subject_id, models.Subject.owner_id == owner_id).first()

def get_subjects_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Subject]:
    return db.query(models.Subject).filter(models.Subject.owner_id == owner_id).offset(skip).limit(limit).all()

def create_subject(db: Session, subject: schemas.SubjectCreate, owner_id: int) -> models.Subject:
    db_subject = models.Subject(**subject.model_dump(), owner_id=owner_id)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

def update_subject(db: Session, subject_id: int, subject_update: schemas.SubjectUpdate, owner_id: int) -> Optional[models.Subject]:
    db_subject = get_subject(db, subject_id, owner_id)
    if not db_subject:
        return None
    update_data = subject_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subject, key, value)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

def delete_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.Subject]:
    db_subject = get_subject(db, subject_id, owner_id)
    if not db_subject:
        return None
    db.delete(db_subject)
    db.commit()
    return db_subject

# --- Topic CRUD ---
def get_topic(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    # Overuje vlastníctvo cez predmet, ku ktorému téma patrí
    return db.query(models.Topic).join(models.Subject).filter(
        models.Topic.id == topic_id,
        models.Subject.owner_id == owner_id
    ).first()

def get_topics_by_subject(db: Session, subject_id: int, owner_id: int, skip: int = 0, limit: int = 1000) -> List[models.Topic]:
    # Najprv over, či predmet patrí používateľovi
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id, models.Subject.owner_id == owner_id).first()
    if not subject:
        return [] # Alebo hodiť chybu/vrátiť None, aby router mohol vrátiť 404
    return db.query(models.Topic).filter(models.Topic.subject_id == subject_id).offset(skip).limit(limit).all()

def create_topic(db: Session, topic: schemas.TopicCreate, subject_id: int, owner_id: int) -> Optional[models.Topic]:
    db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id, models.Subject.owner_id == owner_id).first()
    if not db_subject:
        return None # Predmet neexistuje alebo nepatrí aktuálnemu používateľovi
    
    # Zaisti, že status má defaultnú hodnotu, ak nie je poskytnutý a schéma to povoľuje
    topic_data = topic.model_dump()
    if 'status' not in topic_data or topic_data['status'] is None: # Ak schéma povoľuje None
        topic_data['status'] = models.TopicStatus.NOT_STARTED

    db_topic = models.Topic(**topic_data, subject_id=subject_id)
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

def update_topic(db: Session, topic_id: int, topic_update: schemas.TopicUpdate, owner_id: int) -> Optional[models.Topic]:
    db_topic = get_topic(db, topic_id, owner_id) # get_topic už overuje vlastníctvo
    if not db_topic:
        return None
    
    update_data = topic_update.model_dump(exclude_unset=True) # exclude_unset je dôležité pre PATCH-like správanie
    for key, value in update_data.items():
        setattr(db_topic, key, value)
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

def delete_topic(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    db_topic = get_topic(db, topic_id, owner_id) # get_topic už overuje vlastníctvo
    if not db_topic:
        return None
    
    deleted_topic_copy = schemas.Topic.model_validate(db_topic) # Vytvor kópiu pre návratovú hodnotu
    db.delete(db_topic)
    db.commit()
    return deleted_topic_copy # Vráť dáta zmazanej témy

# --- StudyPlan CRUD ---

def get_study_plan(db: Session, study_plan_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.id == study_plan_id,
        models.StudyPlan.user_id == owner_id
    ).options(
        selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic), # Preferuj selectinload pre *-to-many
        joinedload(models.StudyPlan.subject) # Subject je one-to-one, joinedload je OK
    ).first()

    # Debug výpis
    if plan:
        print(f"[DEBUG CRUD get_study_plan] Plan ID: {plan.id}")
        for i, block in enumerate(plan.study_blocks):
            print(f"  Block {i} ID: {block.id}, Topic ID: {block.topic_id}, Loaded Topic: {'EXISTS' if block.topic else 'NONE'}")
            if not block.topic:
                 # Tu by si mohol hodiť chybu alebo sa pokúsiť načítať tému manuálne,
                 # ale s ondelete="CASCADE" by to nemalo nastať.
                 print(f"    CRITICAL: Block {block.id} has a topic_id {block.topic_id} but topic object is None!")
    return plan

def get_active_study_plan_for_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.subject_id == subject_id,
        models.StudyPlan.user_id == owner_id,
        models.StudyPlan.status == models.StudyPlanStatus.ACTIVE
    ).options(
        selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic),
        joinedload(models.StudyPlan.subject)
    ).first()

    # Debug výpis
    if plan:
        print(f"[DEBUG CRUD get_active_study_plan_for_subject] Plan ID: {plan.id} for Subject ID: {subject_id}")
        for i, block in enumerate(plan.study_blocks):
            print(f"  Block {i} ID: {block.id}, Topic ID: {block.topic_id}, Loaded Topic: {'EXISTS' if block.topic else 'NONE'}")
            if not block.topic:
                 print(f"    CRITICAL: Block {block.id} has a topic_id {block.topic_id} but topic object is None!")
    return plan


def create_study_plan_with_blocks(
    db: Session,
    subject_id: int,
    owner_id: int,
    name: Optional[str] = None
) -> Optional[models.StudyPlan]:
    subject = db.query(models.Subject).filter(
        models.Subject.id == subject_id,
        models.Subject.owner_id == owner_id
    ).options(selectinload(models.Subject.topics)).first() # Použi selectinload pre topics

    if not subject:
        print(f"[DEBUG CRUD create_study_plan] Subject {subject_id} not found for owner {owner_id}")
        return None

    existing_plan = get_active_study_plan_for_subject(db, subject_id, owner_id)
    if existing_plan:
        print(f"[DEBUG CRUD create_study_plan] Active plan already exists for subject {subject_id}, returning existing.")
        return existing_plan # Vráti existujúci, už by mal mať načítané témy správne

    plan_name = name or f"Študijný plán pre {subject.name}"
    db_study_plan = models.StudyPlan(
        name=plan_name,
        user_id=owner_id,
        subject_id=subject_id,
        status=models.StudyPlanStatus.ACTIVE
    )
    db.add(db_study_plan)
    # Ešte necommitujeme, potrebujeme ID pre bloky, alebo commitneme a refreshneme
    # Lepšie je priradiť ORM objekty priamo a commitnúť naraz
    
    study_blocks_to_create_orm = []
    current_scheduled_date = datetime.utcnow().date() + timedelta(days=1)
    topics_to_plan = [topic for topic in subject.topics if topic.status != models.TopicStatus.COMPLETED]

    print(f"[DEBUG CRUD create_study_plan] Found {len(topics_to_plan)} topics to plan for subject {subject.name}")

    if not topics_to_plan:
        db.commit() # Commitni aspoň prázdny plán
        db.refresh(db_study_plan)
        return db_study_plan # Vráti plán bez blokov

    for topic_orm_obj in topics_to_plan: # Iteruj cez ORM objekty tém
        block_data = schemas.StudyBlockCreate(
            topic_id=topic_orm_obj.id, # Toto je stále potrebné pre schému, ak ju používaš
            scheduled_at=datetime.combine(current_scheduled_date, datetime.min.time()),
            duration_minutes=60,
            status=models.StudyBlockStatus.PLANNED
        )
        db_block = models.StudyBlock(
            scheduled_at=block_data.scheduled_at,
            duration_minutes=block_data.duration_minutes,
            status=block_data.status,
            notes=block_data.notes,
            topic_id=topic_orm_obj.id, # Nastav topic_id
            study_plan=db_study_plan  # Nastav vzťah k plánu
            # SQLAlchemy by malo po commite a pri ďalšom query automaticky načítať `topic` ORM objekt
            # na základe `topic_id` a vzťahu `topic = relationship("Topic")`
        )
        # Ak chceme mať `topic` objekt hneď k dispozícii na `db_block` PRED commitom (nie je nutné pre tento use case):
        # db_block.topic = topic_orm_obj
        study_blocks_to_create_orm.append(db_block)
        current_scheduled_date += timedelta(days=1)

    db.add_all(study_blocks_to_create_orm)
    db.commit()
    db.refresh(db_study_plan) # Načítaj plán, jeho study_blocks by mali byť teraz v session

    # Načítaj finálny plán s explicitným eager loadingom všetkého potrebného pre schému
    final_plan = get_study_plan(db, db_study_plan.id, owner_id)
    print(f"[DEBUG CRUD create_study_plan] Final plan created with ID: {final_plan.id if final_plan else 'None'}")
    return final_plan


def update_study_plan(db: Session, study_plan_id: int, plan_update: schemas.StudyPlanUpdate, owner_id: int) -> Optional[models.StudyPlan]:
    db_plan = get_study_plan(db, study_plan_id, owner_id)
    if not db_plan:
        return None
    update_data = plan_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    # Znovu načítaj s eager loadingom pre konzistentnú odpoveď
    return get_study_plan(db, db_plan.id, owner_id)


# --- StudyBlock CRUD ---
def get_study_block(db: Session, study_block_id: int, owner_id: int) -> Optional[models.StudyBlock]:
    return db.query(models.StudyBlock).join(models.StudyPlan).filter(
        models.StudyBlock.id == study_block_id,
        models.StudyPlan.user_id == owner_id
    ).options(joinedload(models.StudyBlock.topic)).first() # joinedload je tu OK, lebo je to many-to-one

def update_study_block(db: Session, study_block_id: int, block_update: schemas.StudyBlockUpdate, owner_id: int) -> Optional[models.StudyBlock]:
    db_block = get_study_block(db, study_block_id, owner_id)
    if not db_block:
        return None
    update_data = block_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_block, key, value)
    if 'status' in update_data and update_data['status'] == models.StudyBlockStatus.COMPLETED:
        if db_block.topic and db_block.topic.status != models.TopicStatus.COMPLETED:
            db_block.topic.status = models.TopicStatus.COMPLETED
            db.add(db_block.topic)
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    # Znovu načítaj s eager loadingom pre konzistentnú odpoveď
    return get_study_block(db, db_block.id, owner_id)