# backend/app/database.py
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import Engine
from app.config import settings # Import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

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
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    if db.bind and db.bind.dialect.name == "sqlite":
        db.execute(text("PRAGMA foreign_keys=ON"))
    try:
        yield db
    finally:
        db.close()