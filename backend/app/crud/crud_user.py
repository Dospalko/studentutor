# backend/app/crud/crud_user.py
from sqlalchemy.orm import Session
from typing import Optional, TYPE_CHECKING
from ..db import models # Importuj modely z ich nového umiestnenia
from ..core.security import get_password_hash # Importuj z nového security modulu
if TYPE_CHECKING:
      from ..schemas.user import UserCreate # Pre typovú anotáciu

def get_user(db: Session, user_id: int) -> Optional[models.User]:
      return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
      return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: 'UserCreate') -> models.User:
      hashed_password = get_password_hash(user.password)
      db_user = models.User(
          email=user.email, hashed_password=hashed_password, full_name=user.full_name
      )
      db.add(db_user)
      db.commit()
      db.refresh(db_user)
      return db_user