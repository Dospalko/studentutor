# backend/app/db/models/__init__.py

# Správny spôsob, ako importovať Base, ak __init__.py v models
# slúži len na sprístupnenie modelov a samotné modely (napr. user.py)
# importujú Base priamo z app.db.base

# Ak by si chcel Base sprístupniť cez app.db.models.Base (menej bežné):
# from ..base import Base # Relatívny import o jednu úroveň vyššie (na app.db.base)

# Najčistejšie je, aby každý modelový súbor (user.py, subject.py, atď.)
# importoval Base priamo:
# Napr. v app/db/models/user.py:
# from app.db.base import Base

# Takže tento __init__.py súbor by mal len exportovať modely:
from .user import User # <--- TOTO JE PROBLÉM (1)
from .subject import Subject
from .topic import Topic
from .study_plan import StudyPlan, StudyBlock
from .study_material import StudyMaterial

from .achievement import Achievement
from .user_achievement import UserAchievement