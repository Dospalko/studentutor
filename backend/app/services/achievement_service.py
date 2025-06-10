# backend/app/services/achievement_service.py
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, TYPE_CHECKING

# Importuj ORM modely a Enumy
from app.db.models.user import User as UserModel
from app.db.models.achievement import Achievement
from app.db.models.user_achievement import UserAchievement
from app.db.models.study_plan import StudyPlan 
from app.db.models.topic import Topic 
from app.db.models.subject import Subject as SubjectModel # <<<<<====== PRIDANÝ TENTO IMPORT
from app.db.enums import AchievementCriteriaType, TopicStatus

# Import definícií achievementov
from app.core.achievements_definitions import ALL_ACHIEVEMENTS_DEFINITIONS

if TYPE_CHECKING:
    from app.crud import crud_user, crud_subject, crud_topic, crud_study_plan


def get_or_create_achievement(
    db: Session, 
    name: str, 
    description: str, 
    icon_name: Optional[str], 
    criteria_type: AchievementCriteriaType, 
    criteria_value: int
) -> Achievement:
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
        print(f"Achievement '{name}' created in DB.")
    return db_achievement

def grant_achievement_if_not_yet_achieved(db: Session, user: UserModel, achievement_to_grant: Achievement):
    existing_user_achievement = db.query(UserAchievement).filter(
        UserAchievement.user_id == user.id,
        UserAchievement.achievement_id == achievement_to_grant.id
    ).first()

    if not existing_user_achievement:
        user_achievement = UserAchievement(user_id=user.id, achievement_id=achievement_to_grant.id)
        db.add(user_achievement)
        # Commit sa vykoná na konci check_and_grant_achievements
        print(f"Achievement '{achievement_to_grant.name}' granted to user ID {user.id}")
        return True
    return False

def check_and_grant_achievements(db: Session, user: UserModel, specific_event_type: Optional[AchievementCriteriaType] = None):
    print(f"Checking achievements for user ID {user.id}, event type: {specific_event_type}")
    
    achievements_to_check = []
    if specific_event_type:
        achievements_to_check = [
            ach_def for ach_def in ALL_ACHIEVEMENTS_DEFINITIONS 
            if ach_def["criteria_type"] == specific_event_type
        ]
    else:
        achievements_to_check = ALL_ACHIEVEMENTS_DEFINITIONS

    if not achievements_to_check:
        print("No relevant achievements to check for this event type or no definitions found.")
        return

    defined_achievements_in_db = {}
    for ach_def in achievements_to_check:
        ach_name = ach_def["name"]
        if ach_name not in defined_achievements_in_db:
            defined_achievements_in_db[ach_name] = get_or_create_achievement(
                db, ach_def["name"], ach_def["description"], ach_def["icon_name"], 
                ach_def["criteria_type"], ach_def["criteria_value"]
            )
    
    # 1. Počet vytvorených predmetov
    if specific_event_type == AchievementCriteriaType.SUBJECTS_CREATED or not specific_event_type:
        # Ak user.subjects nie sú spoľahlivo načítané s user objektom, použi CRUD:
        # from app.crud.crud_subject import get_subjects_by_owner # Lokálny import
        # subjects_count = len(get_subjects_by_owner(db, owner_id=user.id))
        subjects_count = len(user.subjects) # Predpokladá, že user.subjects je aktuálne

        for ach_def in [d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.SUBJECTS_CREATED]:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm and subjects_count >= achievement_orm.criteria_value:
                grant_achievement_if_not_yet_achieved(db, user, achievement_orm)

    # 2. Počet dokončených tém (celkovo)
    if specific_event_type == AchievementCriteriaType.TOPICS_COMPLETED or not specific_event_type:
        # Tu je SubjectModel už správne importovaný
        completed_topics_count = db.query(Topic).join(SubjectModel).filter(
            SubjectModel.owner_id == user.id,
            Topic.status == TopicStatus.COMPLETED
        ).count()
        print(f"User ID {user.id} has {completed_topics_count} completed topics in total.")
        
        for ach_def in [d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.TOPICS_COMPLETED]:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm and completed_topics_count >= achievement_orm.criteria_value:
                grant_achievement_if_not_yet_achieved(db, user, achievement_orm)
    
    # 3. Prvý vygenerovaný plán
    if specific_event_type == AchievementCriteriaType.FIRST_PLAN_GENERATED or not specific_event_type:
        ach_def = next((d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.FIRST_PLAN_GENERATED), None)
        if ach_def:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm:
                user_has_any_plan = db.query(StudyPlan).filter(StudyPlan.user_id == user.id).first() is not None
                if user_has_any_plan:
                    grant_achievement_if_not_yet_achieved(db, user, achievement_orm)
    
    try:
        db.commit() # Jeden commit na konci pre všetky udelené achievementy
    except Exception as e:
        db.rollback()
        print(f"Error committing achievements for user {user.id}: {e}")
        # Môžeš zvážiť logovanie chyby alebo iné ošetrenie