# backend/app/db/base.py
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

def init_db(engine): # Prijme engine ako argument
    # Importuj všetky ORM modely tu, aby boli zaregistrované v Base.metadata
    # pred volaním create_all(). Použi plné cesty podľa tvojej štruktúry.
    # Tento prístup zabezpečí, že sa Base načíta skôr ako modely,
    # a modely sa načítajú skôr ako sa volá create_all.
    print("[DB INIT - base.py] Importing models for table creation...")
    from .models.user import User
    from .models.subject import Subject
    from .models.topic import Topic
    from .models.study_plan import StudyPlan, StudyBlock
    from .models.study_material import StudyMaterial
    # Ak máš __init__.py v app.db.models, ktorý importuje všetky modely, stačilo by:
    # from . import models # a potom by si sa uistil, že __init__.py v models ich naozaj má

    print("[DB INIT - base.py] Attempting to create database tables...")
    Base.metadata.create_all(bind=engine)
    print("[DB INIT - base.py] Database tables process finished.")