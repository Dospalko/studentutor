# backend/app/crud/crud_subject.py
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, TYPE_CHECKING

from backend.app.crud import crud_user
from backend.app.services.achievement_service import check_and_grant_achievements
from ..db import models
if TYPE_CHECKING:
      from ..schemas.subject import SubjectCreate, SubjectUpdate

def get_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.Subject]:
      return db.query(models.Subject).filter(
          models.Subject.id == subject_id,
          models.Subject.owner_id == owner_id
      ).options(selectinload(models.Subject.topics)).first()

def get_subjects_by_owner(db: Session, owner_id: int, skip: int = 0, limit: int = 100) -> List[models.Subject]:
      return db.query(models.Subject).filter(models.Subject.owner_id == owner_id).order_by(models.Subject.name).offset(skip).limit(limit).all()

def create_subject(db: Session, subject: 'SubjectCreate', owner_id: int) -> models.Subject:
      db_subject = models.Subject(**subject.model_dump(), owner_id=owner_id)
      db.add(db_subject)
      db.commit()
      db.refresh(db_subject)
      user_orm = crud_user.get_user(db, user_id=owner_id) # Načítaj ORM usera
      if user_orm:
         check_and_grant_achievements(db, user_orm)
      return db_subject

def update_subject(db: Session, subject_id: int, subject_update: 'SubjectUpdate', owner_id: int) -> Optional[models.Subject]:
      db_subject = get_subject(db, subject_id, owner_id) # Už načíta aj témy
      if not db_subject:
          return None
      update_data = subject_update.model_dump(exclude_unset=True)
      for key, value in update_data.items():
          setattr(db_subject, key, value)
      db.add(db_subject)
      db.commit()
      db.refresh(db_subject)
      return db_subject # Vráti ORM objekt, router ho skonvertuje

def delete_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.Subject]:
      db_subject = get_subject(db, subject_id, owner_id)
      if not db_subject:
          return None
      db.delete(db_subject) # CASCADE by malo zmazať témy a plány/bloky
      db.commit()
      return db_subject # Vráti detached ORM objekt