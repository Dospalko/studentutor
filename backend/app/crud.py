# backend/app/crud.py
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func
from . import models # Modely by mali byť bezpečné na import na začiatku
from passlib.context import CryptContext
from typing import List, Optional, TYPE_CHECKING # DÔLEŽITÉ: Importuj TYPE_CHECKING
from datetime import datetime, timedelta

# Tento import sa vykoná len počas statickej typovej kontroly (napr. MyPy),
# ale nie počas behu programu, čím sa predíde cyklickému importu pri štarte.
if TYPE_CHECKING:
    from . import schemas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Password utils ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- User CRUD ---
def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

# Použi stringovú anotáciu pre 'schemas.UserCreate'
def create_user(db: Session, user: 'schemas.UserCreate') -> models.User:
    # Ak by si tu potreboval pristupovať k atribútom user ako k Pydantic modelu,
    # napr. user.model_dump(), a user je typu 'schemas.UserCreate',
    # Python počas behu nevie, čo 'schemas.UserCreate' je.
    # V takom prípade by si musel dať lokálny import:
    # from . import schemas
    # A potom by user mal byť anotovaný ako schemas.UserCreate (nie string).
    # ALE, FastAPI sa postará o validáciu a konverziu vstupných dát na Pydantic model
    # ešte predtým, ako sa táto funkcia zavolá, takže `user` už BUDE inštancia
    # Pydantic modelu `UserCreate`. Stringová anotácia je tu len pre type checker
    # a pre riešenie cyklických importov na úrovni definície funkcie.
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
def get_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.Subject]:
    return db.query(models.Subject).filter(
        models.Subject.id == subject_id,
        models.Subject.owner_id == owner_id
    ).options(selectinload(models.Subject.topics)).first()

def get_subjects_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Subject]:
    return db.query(models.Subject).filter(models.Subject.owner_id == owner_id).order_by(models.Subject.name).offset(skip).limit(limit).all()

# Použi stringové anotácie
def create_subject(db: Session, subject: 'schemas.SubjectCreate', owner_id: int) -> models.Subject:
    db_subject = models.Subject(**subject.model_dump(), owner_id=owner_id) # .model_dump() je metóda Pydantic modelu
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

def update_subject(db: Session, subject_id: int, subject_update: 'schemas.SubjectUpdate', owner_id: int) -> Optional[models.Subject]:
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
    # Vrátenie db_subject je OK, FastAPI router sa postará o konverziu na schému, ak je response_model nastavený.
    # Ak by Pydantic schéma vyžadovala konverziu tu (napr. `schemas.Subject.model_validate(db_subject)`),
    # potom by bol potrebný lokálny import `schemas` alebo import na začiatku.
    return db_subject

# --- Topic CRUD ---
def get_topic(db: Session, topic_id: int, owner_id: int) -> Optional[models.Topic]:
    return db.query(models.Topic).join(models.Subject).filter(
        models.Topic.id == topic_id,
        models.Subject.owner_id == owner_id
    ).first()

def get_topics_by_subject(db: Session, subject_id: int, owner_id: int, skip: int = 0, limit: int = 1000) -> List[models.Topic]:
    subject = get_subject(db, subject_id, owner_id)
    if not subject:
        return []
    all_topics = sorted(subject.topics, key=lambda t: t.name)
    return all_topics[skip : skip + limit]

# Použi stringové anotácie
def create_topic(db: Session, topic: 'schemas.TopicCreate', subject_id: int, owner_id: int) -> Optional[models.Topic]:
    db_subject = get_subject(db, subject_id, owner_id)
    if not db_subject:
        return None
    topic_data = topic.model_dump()
    if topic_data.get('status') is None:
        topic_data['status'] = models.TopicStatus.NOT_STARTED
    db_topic = models.Topic(**topic_data, subject_id=subject_id)
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

def update_topic(db: Session, topic_id: int, topic_update: 'schemas.TopicUpdate', owner_id: int) -> Optional[models.Topic]:
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
    # Ak by si chcel vrátiť dáta ako schému PRED zmazaním:
    # if TYPE_CHECKING: from . import schemas # alebo lokálny import
    # deleted_data = schemas.Topic.model_validate(db_topic)
    db.delete(db_topic)
    db.commit()
    return db_topic # alebo deleted_data, ak je response_model v routeri nastavený na schému

# --- StudyPlan CRUD ---
# Použi stringové anotácie pre schema typy
def get_study_plan(db: Session, study_plan_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.id == study_plan_id,
        models.StudyPlan.user_id == owner_id
    ).options(
        selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic),
        joinedload(models.StudyPlan.subject)
    ).first()
    # Debug výpisy ... (ponechané z predchádzajúcej verzie)
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
    # Debug výpisy ... (ponechané z predchádzajúcej verzie)
    return plan

def create_study_plan_with_blocks(
    db: Session,
    subject_id: int,
    owner_id: int,
    name: Optional[str] = None,
    force_regenerate: bool = False # Nový parameter na vynútenie pregenerovania
) -> Optional[models.StudyPlan]:
    from . import schemas # Lokálny import

    subject = get_subject(db, subject_id=subject_id, owner_id=owner_id) # get_subject by mal načítať aj subject.topics
    if not subject:
        print(f"[DEBUG CRUD create_study_plan] Subject {subject_id} not found for owner {owner_id}")
        return None

    existing_active_plan = get_active_study_plan_for_subject(db, subject_id, owner_id)

    if existing_active_plan and not force_regenerate:
        print(f"[DEBUG CRUD create_study_plan] Active plan ID {existing_active_plan.id} found for subject {subject_id}.")
        # Skontroluj, či treba pridať nové témy do existujúceho plánu
        all_subject_topics_ids = {t.id for t in subject.topics}
        planned_topic_ids_in_active_plan = {b.topic_id for b in existing_active_plan.study_blocks}
        
        newly_added_uncompleted_topics = [
            t for t in subject.topics 
            if t.id not in planned_topic_ids_in_active_plan and t.status != models.TopicStatus.COMPLETED
        ]

        if newly_added_uncompleted_topics:
            print(f"[DEBUG CRUD create_study_plan] Found {len(newly_added_uncompleted_topics)} new uncompleted topics to add to existing plan ID {existing_active_plan.id}.")
            
            # Nájdi posledný naplánovaný dátum v existujúcom pláne, alebo začni od zajtra
            last_scheduled_date = datetime.utcnow().date()
            if existing_active_plan.study_blocks:
                valid_dates = [b.scheduled_at.date() for b in existing_active_plan.study_blocks if b.scheduled_at]
                if valid_dates:
                    last_scheduled_date = max(valid_dates)
            
            current_scheduled_date = last_scheduled_date + timedelta(days=1)

            for i, topic_orm_obj in enumerate(newly_added_uncompleted_topics):
                scheduled_datetime = datetime.combine(current_scheduled_date, datetime.min.time())
                print(f"  Adding block {i+1} for new Topic ID {topic_orm_obj.id} ('{topic_orm_obj.name}') scheduled for {scheduled_datetime}")
                new_block = models.StudyBlock(
                    scheduled_at=scheduled_datetime,
                    duration_minutes=60,
                    status=models.StudyBlockStatus.PLANNED,
                    topic_id=topic_orm_obj.id,
                )
                existing_active_plan.study_blocks.append(new_block)
                current_scheduled_date += timedelta(days=1)
            
            db.add(existing_active_plan) # Pridaj zmenený plán do session
            db.commit()
            print(f"[DEBUG CRUD create_study_plan] Committed updates to existing plan ID {existing_active_plan.id}.")
            # Načítaj plán znova, aby sa prejavili zmeny a eager loading
            return get_study_plan(db, existing_active_plan.id, owner_id)
        else:
            print(f"[DEBUG CRUD create_study_plan] No new topics to add to existing plan. Returning it as is.")
            return get_study_plan(db, existing_active_plan.id, owner_id) # Vráť existujúci, plne načítaný

    # Ak neexistuje aktívny plán ALEBO je force_regenerate=True
    if existing_active_plan and force_regenerate:
        print(f"[DEBUG CRUD create_study_plan] Force regenerate: Archiving old plan ID {existing_active_plan.id}")
        existing_active_plan.status = models.StudyPlanStatus.ARCHIVED
        db.add(existing_active_plan)
        # db.commit() # Commitni archiváciu pred vytvorením nového

    # Vytvorenie úplne nového plánu
    plan_name = name or f"Študijný plán pre {subject.name} (nový)"
    print(f"[DEBUG CRUD create_study_plan] Creating new plan: '{plan_name}' for subject '{subject.name}' (ID: {subject.id})")
    db_study_plan = models.StudyPlan(
        name=plan_name, user_id=owner_id, subject_id=subject_id, status=models.StudyPlanStatus.ACTIVE
    )
    db.add(db_study_plan)

    topics_to_plan_for_new_plan = [topic for topic in subject.topics if topic.status != models.TopicStatus.COMPLETED]
    print(f"[DEBUG CRUD create_study_plan] For new plan: Found {len(topics_to_plan_for_new_plan)} topics to plan.")

    if not topics_to_plan_for_new_plan:
        db.commit()
        db.refresh(db_study_plan)
        return get_study_plan(db, db_study_plan.id, owner_id)

    current_scheduled_date = datetime.utcnow().date() + timedelta(days=1)
    for i, topic_orm_obj in enumerate(topics_to_plan_for_new_plan):
        scheduled_datetime = datetime.combine(current_scheduled_date, datetime.min.time())
        new_block = models.StudyBlock(
            scheduled_at=scheduled_datetime, duration_minutes=60, status=models.StudyBlockStatus.PLANNED,
            topic_id=topic_orm_obj.id
        )
        db_study_plan.study_blocks.append(new_block)
        current_scheduled_date += timedelta(days=1)
    
    print(f"[DEBUG CRUD create_study_plan] Committing new plan and {len(db_study_plan.study_blocks)} blocks...")
    db.commit()
    print(f"[DEBUG CRUD create_study_plan] Commit successful. New Plan ID after commit: {db_study_plan.id}")
    return get_study_plan(db, db_study_plan.id, owner_id)

def update_study_plan(db: Session, study_plan_id: int, plan_update: 'schemas.StudyPlanUpdate', owner_id: int) -> Optional[models.StudyPlan]:
    db_plan = get_study_plan(db, study_plan_id, owner_id)
    if not db_plan:
        return None
    update_data = plan_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return get_study_plan(db, db_plan.id, owner_id)

# --- StudyBlock CRUD ---
def get_study_block(db: Session, study_block_id: int, owner_id: int) -> Optional[models.StudyBlock]:
    return db.query(models.StudyBlock).join(models.StudyPlan).filter(
        models.StudyBlock.id == study_block_id,
        models.StudyPlan.user_id == owner_id
    ).options(joinedload(models.StudyBlock.topic)).first()

def update_study_block(db: Session, study_block_id: int, block_update: 'schemas.StudyBlockUpdate', owner_id: int) -> Optional[models.StudyBlock]:
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
    if db_block.topic:
        db.refresh(db_block.topic)
    return get_study_block(db, db_block.id, owner_id)