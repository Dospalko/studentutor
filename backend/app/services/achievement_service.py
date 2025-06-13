# backend/app/services/achievement_service.py
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func
from typing import List, Optional, TYPE_CHECKING
from datetime import date

from app.db.models.user import User as UserModel
from app.db.models.achievement import Achievement
from app.db.models.user_achievement import UserAchievement
from app.db.models.study_plan import StudyPlan, StudyBlock
from app.db.models.topic import Topic 
from app.db.models.subject import Subject as SubjectModel
from app.db.models.study_material import StudyMaterial

from app.db.enums import AchievementCriteriaType, TopicStatus, StudyBlockStatus

from app.core.achievements_definitions import ALL_ACHIEVEMENTS_DEFINITIONS

# Ak by si potreboval CRUD funkcie pre iné entity v rámci tejto služby (čo nie je ideálne)
# if TYPE_CHECKING:
#     from app.crud import crud_user, crud_subject, crud_topic, crud_study_plan


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
    return db_achievement

def grant_achievement_if_not_yet_achieved(db: Session, user: UserModel, achievement_to_grant: Achievement) -> bool:
    existing_user_achievement = db.query(UserAchievement).filter(
        UserAchievement.user_id == user.id,
        UserAchievement.achievement_id == achievement_to_grant.id
    ).first()

    if not existing_user_achievement:
        user_achievement = UserAchievement(user_id=user.id, achievement_id=achievement_to_grant.id)
        db.add(user_achievement)
        # db.commit() # Commit sa vykoná na konci check_and_grant_achievements
        print(f"Achievement '{achievement_to_grant.name}' granted to user ID {user.id}")
        return True
    return False

def check_and_grant_achievements(db: Session, user: UserModel, specific_event_type: Optional[AchievementCriteriaType] = None):
    print(f"Checking achievements for user ID {user.id}, event type: {specific_event_type}")
    
    # Načítaj používateľa s prepojenými entitami pre aktuálne dáta
    # Toto je dôležité, ak `user` objekt prichádzajúci do funkcie nemusí byť aktuálny
    user_with_relations = db.query(UserModel).options(
        selectinload(UserModel.subjects).options(
            selectinload(SubjectModel.topics),
            selectinload(SubjectModel.materials)
        )
        # Pridaj ďalšie potrebné vzťahy, napr. pre StudyPlan, ak ich potrebuješ priamo z user objektu
    ).filter(UserModel.id == user.id).first()

    if not user_with_relations:
        print(f"User with ID {user.id} not found for achievement check.")
        return
    
    # Pracuj s čerstvo načítaným používateľom
    current_user_state = user_with_relations

    achievements_to_check = [
        ach_def for ach_def in ALL_ACHIEVEMENTS_DEFINITIONS
        if not specific_event_type or ach_def["criteria_type"] == specific_event_type
    ]

    if not achievements_to_check:
        print("No relevant achievements to check based on definitions or event type.")
        return

    defined_achievements_in_db = {}
    for ach_def in achievements_to_check:
        ach_name = ach_def["name"]
        if ach_name not in defined_achievements_in_db:
            defined_achievements_in_db[ach_name] = get_or_create_achievement(
                db, ach_def["name"], ach_def["description"], ach_def.get("icon_name"), 
                ach_def["criteria_type"], ach_def["criteria_value"]
            )
    
    granted_new = False # Flag na sledovanie, či bol udelený nejaký nový achievement

    # 1. SUBJECTS_CREATED
    if not specific_event_type or specific_event_type == AchievementCriteriaType.SUBJECTS_CREATED:
        subjects_count = len(current_user_state.subjects)
        for ach_def in [d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.SUBJECTS_CREATED]:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm and subjects_count >= achievement_orm.criteria_value:
                if grant_achievement_if_not_yet_achieved(db, current_user_state, achievement_orm): granted_new = True

    # 2. TOPICS_COMPLETED (celkovo)
    if not specific_event_type or specific_event_type == AchievementCriteriaType.TOPICS_COMPLETED:
        completed_topics_count = db.query(func.count(Topic.id)).join(SubjectModel).filter(
            SubjectModel.owner_id == current_user_state.id,
            Topic.status == TopicStatus.COMPLETED
        ).scalar() or 0
        for ach_def in [d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.TOPICS_COMPLETED]:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm and completed_topics_count >= achievement_orm.criteria_value:
                if grant_achievement_if_not_yet_achieved(db, current_user_state, achievement_orm): granted_new = True
       
    # 3. FIRST_PLAN_GENERATED
    if not specific_event_type or specific_event_type == AchievementCriteriaType.FIRST_PLAN_GENERATED:
        ach_def = next((d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.FIRST_PLAN_GENERATED), None)
        if ach_def:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm:
                user_has_any_plan = db.query(StudyPlan.id).filter(StudyPlan.user_id == current_user_state.id).first() is not None
                if user_has_any_plan:
                    if grant_achievement_if_not_yet_achieved(db, current_user_state, achievement_orm): granted_new = True

    # 4. TOPICS_CREATED_PER_SUBJECT ("Organizátor")
    if not specific_event_type or specific_event_type == AchievementCriteriaType.TOPICS_CREATED_PER_SUBJECT:
        ach_def = next((d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.TOPICS_CREATED_PER_SUBJECT), None)
        if ach_def:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm:
                for subject_item in current_user_state.subjects:
                    if len(subject_item.topics) >= achievement_orm.criteria_value:
                        if grant_achievement_if_not_yet_achieved(db, current_user_state, achievement_orm): granted_new = True
                        break 

    # 5. PLANS_GENERATED_OR_UPDATED ("Systematik")
    if not specific_event_type or specific_event_type == AchievementCriteriaType.PLANS_GENERATED_OR_UPDATED:
        # TODO: Implementovať sledovanie počtu generovaných/aktualizovaných plánov
        # Potrebuješ spôsob, ako tento počet ukladať (napr. stĺpec v User, alebo audit log)
        pass

    # 6. STUDY_MATERIALS_UPLOADED_PER_SUBJECT ("Knižný Mol")
    if not specific_event_type or specific_event_type == AchievementCriteriaType.STUDY_MATERIALS_UPLOADED_PER_SUBJECT:
        ach_def = next((d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.STUDY_MATERIALS_UPLOADED_PER_SUBJECT), None)
        if ach_def:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm:
                for subject_item in current_user_state.subjects:
                    if len(subject_item.materials) >= achievement_orm.criteria_value:
                        if grant_achievement_if_not_yet_achieved(db, current_user_state, achievement_orm): granted_new = True
                        break 

    # 7. TOPICS_IN_SUBJECT_COMPLETED_PERCENT ("Polčas Predmetu")
    if not specific_event_type or specific_event_type == AchievementCriteriaType.TOPICS_IN_SUBJECT_COMPLETED_PERCENT:
        ach_def = next((d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.TOPICS_IN_SUBJECT_COMPLETED_PERCENT), None)
        if ach_def:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm:
                for subject_item in current_user_state.subjects:
                    if not subject_item.topics or len(subject_item.topics) == 0: continue
                    completed_in_subject = len([t for t in subject_item.topics if t.status == TopicStatus.COMPLETED])
                    percentage = (completed_in_subject / len(subject_item.topics)) * 100
                    if percentage >= achievement_orm.criteria_value:
                        if grant_achievement_if_not_yet_achieved(db, current_user_state, achievement_orm): granted_new = True
                        # Ak má byť tento achievement len raz, pridaj `break`

    # 8. SUBJECT_FULLY_COMPLETED ("Predmet Zvládnutý!")
    if not specific_event_type or specific_event_type == AchievementCriteriaType.SUBJECT_FULLY_COMPLETED:
        ach_def = next((d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.SUBJECT_FULLY_COMPLETED), None)
        if ach_def:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm:
                fully_completed_subjects_count = 0
                for subject_item in current_user_state.subjects:
                    if not subject_item.topics or len(subject_item.topics) == 0: continue
                    if all(t.status == TopicStatus.COMPLETED for t in subject_item.topics):
                        fully_completed_subjects_count += 1
                if fully_completed_subjects_count >= achievement_orm.criteria_value:
                    if grant_achievement_if_not_yet_achieved(db, current_user_state, achievement_orm): granted_new = True
       
    # 9. TOTAL_STUDY_BLOCKS_COMPLETED ("Učebný Stroj")
    if not specific_event_type or specific_event_type == AchievementCriteriaType.TOTAL_STUDY_BLOCKS_COMPLETED:
        ach_def = next((d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.TOTAL_STUDY_BLOCKS_COMPLETED), None)
        if ach_def:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm:
                completed_blocks_count = db.query(func.count(StudyBlock.id)).join(StudyPlan).filter(
                    StudyPlan.user_id == current_user_state.id,
                    StudyBlock.status == StudyBlockStatus.COMPLETED
                ).scalar() or 0
                if completed_blocks_count >= achievement_orm.criteria_value:
                    if grant_achievement_if_not_yet_achieved(db, current_user_state, achievement_orm): granted_new = True

    # 10. TOTAL_MATERIALS_UPLOADED ("Vedomostná Zásoba")
    if not specific_event_type or specific_event_type == AchievementCriteriaType.TOTAL_MATERIALS_UPLOADED:
        ach_def = next((d for d in achievements_to_check if d["criteria_type"] == AchievementCriteriaType.TOTAL_MATERIALS_UPLOADED), None)
        if ach_def:
            achievement_orm = defined_achievements_in_db.get(ach_def["name"])
            if achievement_orm:
                total_materials = db.query(func.count(StudyMaterial.id)).filter(
                    StudyMaterial.owner_id == current_user_state.id
                ).scalar() or 0
                if total_materials >= achievement_orm.criteria_value:
                    if grant_achievement_if_not_yet_achieved(db, current_user_state, achievement_orm): granted_new = True
    
    if granted_new:
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error committing (newly granted) achievements for user {current_user_state.id}: {e}")
    else:
        # Ak nebol udelený žiadny nový achievement, nie je potrebné robiť commit
        # (predpokladáme, že get_or_create_achievement už commituje, ak vytvára nový typ achievementu)
        pass