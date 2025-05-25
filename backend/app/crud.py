# backend/app/crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext
from typing import List, Optional # Pridaj Optional a List

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
def get_topic(db: Session, topic_id: int, owner_id: int): # Overuje vlastníctvo cez predmet
    return db.query(models.Topic).join(models.Subject).filter(models.Topic.id == topic_id, models.Subject.owner_id == owner_id).first()

def get_topics_by_subject(db: Session, subject_id: int, owner_id: int, skip: int = 0, limit: int = 1000) -> List[models.Topic]:
    # Uisti sa, že predmet patrí používateľovi
    subject = get_subject(db, subject_id, owner_id)
    if not subject:
        return [] # Alebo hodiť chybu, ak predmet neexistuje / nepatrí userovi
    return db.query(models.Topic).filter(models.Topic.subject_id == subject_id).offset(skip).limit(limit).all()

def create_topic(db: Session, topic: schemas.TopicCreate, subject_id: int, owner_id: int) -> Optional[models.Topic]:
    # Uisti sa, že predmet patrí používateľovi
    db_subject = get_subject(db, subject_id, owner_id)
    if not db_subject:
        return None # Predmet neexistuje alebo nepatrí aktuálnemu používateľovi
    
    db_topic = models.Topic(**topic.model_dump(), subject_id=subject_id)
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

def update_topic(db: Session, topic_id: int, topic_update: schemas.TopicUpdate, owner_id: int) -> Optional[models.Topic]:
    db_topic = get_topic(db, topic_id, owner_id) # get_topic už overuje vlastníctvo
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
    db_topic = get_topic(db, topic_id, owner_id) # get_topic už overuje vlastníctvo
    if not db_topic:
        return None
    db.delete(db_topic)
    db.commit()
    return db_topic