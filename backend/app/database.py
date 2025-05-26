# backend/app/database.py
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
from .config import settings
from sqlalchemy import text
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# --- Event listener pre SQLite na zapnutie Foreign Keys ---
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if dbapi_connection.__class__.__module__ == "sqlite3":
        print("[DEBUG DB EVENT] Setting PRAGMA foreign_keys=ON for SQLite connection.")
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
        # echo=True # Zapni pre detailné SQL logy
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    # Explicitné zapnutie PRAGMA pre každú session - ďalšia vrstva obrany pre SQLite
    if db.bind and db.bind.dialect.name == "sqlite":
        print("[DEBUG get_db] Executing PRAGMA foreign_keys=ON for new session.")
        db.execute(text("PRAGMA foreign_keys=ON")) # Potrebuješ ``
    try:
        yield db
    finally:
        db.close()