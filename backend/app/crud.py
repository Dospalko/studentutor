# backend/app/crud.py
from sqlalchemy.orm import Session, joinedload
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
    return db.query(models.StudyPlan).filter(
        models.StudyPlan.id == study_plan_id,
        models.StudyPlan.user_id == owner_id
    ).options(joinedload(models.StudyPlan.study_blocks).joinedload(models.StudyBlock.topic)).first() # Načítaj aj bloky a ich témy

def get_active_study_plan_for_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    return db.query(models.StudyPlan).filter(
        models.StudyPlan.subject_id == subject_id,
        models.StudyPlan.user_id == owner_id,
        models.StudyPlan.status == models.StudyPlanStatus.ACTIVE
    ).options(joinedload(models.StudyPlan.study_blocks).joinedload(models.StudyBlock.topic)).first()

def create_study_plan_with_blocks(
    db: Session,
    subject_id: int,
    owner_id: int,
    name: Optional[str] = None
) -> Optional[models.StudyPlan]:
    # 1. Over, či predmet existuje a patrí používateľovi
    subject = db.query(models.Subject).filter(
        models.Subject.id == subject_id,
        models.Subject.owner_id == owner_id
    ).options(joinedload(models.Subject.topics)).first() # Načítaj aj témy predmetu

    if not subject:
        return None # Predmet neexistuje alebo nepatrí používateľovi

    # 2. Skontroluj, či už neexistuje aktívny plán pre tento predmet a používateľa
    existing_plan = get_active_study_plan_for_subject(db, subject_id, owner_id)
    if existing_plan:
        # Rozhodnutie: Vrátiť existujúci? Archivovať starý a vytvoriť nový? Alebo chyba?
        # Pre teraz vrátime existujúci, aby sme predišli duplicite aktívnych plánov.
        # Môžeš implementovať logiku archivácie starého plánu tu, ak je to potrebné.
        return existing_plan

    # 3. Vytvor nový StudyPlan
    plan_name = name or f"Študijný plán pre {subject.name}"
    db_study_plan = models.StudyPlan(
        name=plan_name,
        user_id=owner_id,
        subject_id=subject_id,
        status=models.StudyPlanStatus.ACTIVE
    )
    db.add(db_study_plan)
    # db.commit() # Commitneme až po pridaní blokov, alebo commitneme plán a potom bloky
    # db.refresh(db_study_plan) # Potrebujeme ID plánu pre bloky

    # 4. Vygeneruj StudyBlocky pre témy predmetu (napr. tie, čo nie sú COMPLETED)
    study_blocks_to_create = []
    # Jednoduché rozloženie: jedna téma denne, začínajúc od zajtra
    current_scheduled_date = datetime.utcnow().date() + timedelta(days=1)
    
    # Získaj témy, ktoré ešte nie sú dokončené
    topics_to_plan = [topic for topic in subject.topics if topic.status != models.TopicStatus.COMPLETED]
    
    # Ak nie sú žiadne témy na plánovanie, stále vytvor prázdny plán
    if not topics_to_plan:
        db.commit()
        db.refresh(db_study_plan)
        return db_study_plan # Vráti plán bez blokov

    for topic in topics_to_plan:
        # Pre každú tému vytvor StudyBlock
        block_data = schemas.StudyBlockCreate(
            topic_id=topic.id,
            scheduled_at=datetime.combine(current_scheduled_date, datetime.min.time()), # Začiatok dňa
            duration_minutes=60, # Defaultná dĺžka, môžeme prispôsobiť
            status=models.StudyBlockStatus.PLANNED
        )
        db_block = models.StudyBlock(
            **block_data.model_dump(exclude={'topic_id'}), # topic_id je už vo vzťahu
            topic_id=topic.id, # Alebo takto explicitne
            study_plan=db_study_plan # Pripoj k plánu
        )
        study_blocks_to_create.append(db_block)
        
        # Posuň dátum pre ďalší blok (napr. každý deň jedna téma)
        current_scheduled_date += timedelta(days=1)

    db.add_all(study_blocks_to_create)
    db.commit()
    db.refresh(db_study_plan) # Načítaj aj novo vytvorené bloky do session plánu
    
    # Ešte raz načítaj plán s blokmi a témami pre správne zobrazenie v schéme
    return get_study_plan(db, db_study_plan.id, owner_id)


def update_study_plan(db: Session, study_plan_id: int, plan_update: schemas.StudyPlanUpdate, owner_id: int) -> Optional[models.StudyPlan]:
    db_plan = get_study_plan(db, study_plan_id, owner_id) # get_study_plan už načíta bloky
    if not db_plan:
        return None
    
    update_data = plan_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)
    
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

# --- StudyBlock CRUD ---
def get_study_block(db: Session, study_block_id: int, owner_id: int) -> Optional[models.StudyBlock]:
    # Over, či blok patrí plánu, ktorý patrí používateľovi
    return db.query(models.StudyBlock).join(models.StudyPlan).filter(
        models.StudyBlock.id == study_block_id,
        models.StudyPlan.user_id == owner_id
    ).options(joinedload(models.StudyBlock.topic)).first()

def update_study_block(db: Session, study_block_id: int, block_update: schemas.StudyBlockUpdate, owner_id: int) -> Optional[models.StudyBlock]:
    db_block = get_study_block(db, study_block_id, owner_id)
    if not db_block:
        return None
        
    update_data = block_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_block, key, value)

    # Ak sa blok označí ako dokončený, môžeme aktualizovať aj status príslušnej témy
    if 'status' in update_data and update_data['status'] == models.StudyBlockStatus.COMPLETED:
        if db_block.topic and db_block.topic.status != models.TopicStatus.COMPLETED:
            db_block.topic.status = models.TopicStatus.COMPLETED
            db.add(db_block.topic) # Pridaj zmenenú tému do session

    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block