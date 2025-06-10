# backend/app/services/achievement_service.py
from sqlalchemy.orm import Session
from typing import List, Optional, TYPE_CHECKING # Pridaj TYPE_CHECKING

from app.db.models.user import User as UserModel
from app.db.models.achievement import Achievement
from app.db.models.user_achievement import UserAchievement
from app.db.enums import AchievementCriteriaType
from app.core.achievements_definitions import ALL_ACHIEVEMENTS_DEFINITIONS # Predpokladajme tento súbor

# ODSTRÁŇ GLOBÁLNE IMPORTY CRUD MODULOV ODTIAĽTO:
# from app.crud import crud_user, crud_subject, crud_topic, crud_study_plan 

# Ak potrebuješ typové anotácie pre CRUD funkcie, použi TYPE_CHECKING:
if TYPE_CHECKING:
    from app.crud import crud_user, crud_subject, crud_topic, crud_study_plan


def get_or_create_achievement(db: Session, name: str, description: str, icon_name: Optional[str], criteria_type: AchievementCriteriaType, criteria_value: int) -> Achievement:
    # ... (kód funkcie)
    db_achievement = db.query(Achievement).filter(Achievement.name == name).first()
    if not db_achievement:
        db_achievement = Achievement(
            name=name, 
            description=description, 
            icon_name=icon_name,
            criteria_type=criteria_type,
            criteria_value=criteria_value
        )
        db.add(db_achievement)
        db.commit()
        db.refresh(db_achievement)
    return db_achievement


def grant_achievement_if_not_exists(db: Session, user: UserModel, achievement: Achievement):
    # ... (kód funkcie)
     existing_user_achievement = db.query(UserAchievement).filter(
         UserAchievement.user_id == user.id,
         UserAchievement.achievement_id == achievement.id
     ).first()
     if not existing_user_achievement:
         user_achievement = UserAchievement(user_id=user.id, achievement_id=achievement.id)
         db.add(user_achievement)
         db.commit() # Commitni hneď tu alebo zváž commit na konci check_and_grant_achievements
         print(f"Achievement '{achievement.name}' granted to user ID {user.id}")
         return True
     return False

def check_and_grant_achievements(db: Session, user: UserModel):
    # LOKÁLNE IMPORTY PRE CRUD FUNKCIE, KTORÉ POTREBUJEŠ TU
    from app.crud.crud_subject import get_subjects_by_owner # Príklad
    # from app.crud.crud_topic import get_completed_topics_count_for_user # Ak by si mal takú funkciu
    # from app.crud.crud_study_plan import count_user_study_plans # Ak by si mal takú funkciu

    achievements_in_db = {}
    for ach_def in ALL_ACHIEVEMENTS_DEFINITIONS:
        ach_obj = get_or_create_achievement(db, ach_def["name"], ach_def["description"], ach_def["icon_name"], ach_def["criteria_type"], ach_def["criteria_value"])
        achievements_in_db[ach_def["name"]] = ach_obj
    
    # Príklad: Počet vytvorených predmetov
    # `user.subjects` by malo byť načítané, ak voláš túto funkciu po db.refresh(user)
    # a vzťah user.subjects je správne nakonfigurovaný pre eager/lazy loading.
    # Pre istotu môžeš načítať počet priamo:
    # subjects_count = len(get_subjects_by_owner(db, owner_id=user.id)) # Použi lokálne importovanú funkciu
    subjects_count = len(user.subjects) # Ak je user.subjects spoľahlivo populované

    if "Prvý Predmet" in achievements_in_db and subjects_count >= achievements_in_db["Prvý Predmet"].criteria_value:
        grant_achievement_if_not_exists(db, user, achievements_in_db["Prvý Predmet"])
    if "Päť Predmetov" in achievements_in_db and subjects_count >= achievements_in_db["Päť Predmetov"].criteria_value:
        grant_achievement_if_not_exists(db, user, achievements_in_db["Päť Predmetov"])

    # Príklad: Prvý vygenerovaný plán
    if "Generátor Plánov" in achievements_in_db:
        # from app.crud.crud_study_plan import get_active_study_plan_for_subject # Alebo iná funkcia na zistenie existencie plánu
        # Tento check by mal byť špecifickejší, napr. či bol plán *novo* vytvorený.
        # Ale pre jednoduchosť, ak má nejaký plán:
        if db.query(models.StudyPlan).filter(models.StudyPlan.user_id == user.id).first(): # Potrebuješ import models
             grant_achievement_if_not_exists(db, user, achievements_in_db["Generátor Plánov"])
    
    # db.refresh(user) # Ak sa zmenili user.achievements, refreshni usera pred návratom z volajúcej CRUD funkcie