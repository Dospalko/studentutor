# backend/app/crud/crud_user.py
from sqlalchemy.orm import Session
from typing import Optional, TYPE_CHECKING

# Použi plné cesty k modelom a core.security
from app.db.models.user import User as UserModel # Alias pre ORM model
from app.core.security import get_password_hash, verify_password # Importuj z nového miesta

# Pre typovú anotáciu UserCreate, aby sa predišlo cyklickým importom,
# ak by schemas importovalo niečo z crud (čo by nemalo)
if TYPE_CHECKING:
    from app.schemas.user import UserCreate 

def get_user(db: Session, user_id: int) -> Optional[UserModel]:
    return db.query(UserModel).filter(UserModel.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[UserModel]:
    return db.query(UserModel).filter(UserModel.email == email).first()

# Funkcia teraz očakáva parameter 'user_in' (alebo 'user_create_input', atď.)
# ktorý zodpovedá typu 'UserCreate' zo schém.
# Typová anotácia je stringová pre flexibilitu pri riešení importov.
def create_user(db: Session, user_in: 'UserCreate') -> UserModel:
    """
    Creates a new user in the database.
    'user_in' is expected to be an instance of schemas.user.UserCreate
    """
    hashed_password = get_password_hash(user_in.password)
    db_user = UserModel( # Vytvor ORM model User
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Funkcia verify_password je teraz v core.security