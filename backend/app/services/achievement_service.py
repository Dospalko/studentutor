# backend/app/services/achievement_service.py
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.models.user import User as UserModel
from app.db.models.achievement import Achievement
from app.db.models.user_achievement import UserAchievement
from app.db.enums import AchievementCriteriaType
from app.crud import crud_user, crud_subject, crud_topic, crud_study_plan # Importuj relevantné CRUD moduly

def get_or_create_achievement(db: Session, name: str, description: str, icon_name: Optional[str], criteria_type: AchievementCriteriaType, criteria_value: int) -> Achievement:
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
    existing_user_achievement = db.query(UserAchievement).filter(
        UserAchievement.user_id == user.id,
        UserAchievement.achievement_id == achievement.id
    ).first()
    if not existing_user_achievement:
        user_achievement = UserAchievement(user_id=user.id, achievement_id=achievement.id)
        db.add(user_achievement)
        db.commit()
        print(f"Achievement '{achievement.name}' granted to user ID {user.id}")
        return True
    return False

def check_and_grant_achievements(db: Session, user: UserModel):
    """
    Skontroluje a pridelí achievementy používateľovi na základe jeho aktuálneho stavu.
    Táto funkcia by sa mala volať po relevantných akciách (napr. vytvorenie predmetu, dokončenie témy).
    """
    from app.core.achievements_definitions import ALL_ACHIEVEMENTS_DEFINITIONS # Načítaj definície

    # Načítaj alebo vytvor všetky definované achievementy v DB
    achievements_in_db = {}
    for ach_def in ALL_ACHIEVEMENTS_DEFINITIONS:
        ach_obj = get_or_create_achievement(db, ach_def["name"], ach_def["description"], ach_def["icon_name"], ach_def["criteria_type"], ach_def["criteria_value"])
        achievements_in_db[ach_def["name"]] = ach_obj
    
    # --- Kontrola jednotlivých typov achievementov ---

    # 1. Počet vytvorených predmetov
    subjects_count = len(user.subjects) # Predpokladáme, že user.subjects sú načítané
    # Alebo spoľahlivejšie:
    # subjects_count = db.query(func.count(SubjectModel.id)).filter(SubjectModel.owner_id == user.id).scalar()
    
    if "Prvý Predmet" in achievements_in_db and subjects_count >= achievements_in_db["Prvý Predmet"].criteria_value:
        grant_achievement_if_not_exists(db, user, achievements_in_db["Prvý Predmet"])
    if "Päť Predmetov" in achievements_in_db and subjects_count >= achievements_in_db["Päť Predmetov"].criteria_value:
        grant_achievement_if_not_exists(db, user, achievements_in_db["Päť Predmetov"])

    # 2. Počet dokončených tém (celkovo)
    # Toto je náročnejšie na rýchly výpočet, vyžadovalo by si query cez všetky témy používateľa
    # completed_topics_count = crud_topic.get_completed_topics_count_for_user(db, user_id=user.id) # Musel by si implementovať
    # Pre jednoduchosť to teraz preskočíme, ale je to dôležitý typ

    # 3. Prvý vygenerovaný plán
    # Tento by sa mal udeliť priamo po úspešnom vygenerovaní plánu v crud_study_plan.create_study_plan_with_blocks
    # if "Generátor Plánov" in achievements_in_db:
    #    user_has_plans = db.query(StudyPlanModel).filter(StudyPlanModel.user_id == user.id).first() is not None
    #    if user_has_plans:
    #        grant_achievement_if_not_exists(db, user, achievements_in_db["Generátor Plánov"])
    
    # TODO: Implementovať kontroly pre ďalšie typy achievementov
    # napr. TOPICS_COMPLETED, STUDY_BLOCKS_COMPLETED

    db.refresh(user) # Aby sa načítali novo pridané user.achievements