# backend/app/crud/crud_study_plan.py
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional, TYPE_CHECKING
from datetime import datetime, timedelta

# SPRÁVNY IMPORT pre achievement_service
from app.services.achievement_service import check_and_grant_achievements, get_or_create_achievement, grant_achievement_if_not_exists
# Importuj achievement definitions, ak ich tu priamo používaš
from app.core.achievements_definitions import ALL_ACHIEVEMENTS_DEFINITIONS


# Import ORM modelov
from app.db import models

# Import Enumov
from app.db.enums import StudyPlanStatus, StudyBlockStatus, TopicStatus 

# Import CRUD funkcií
from .crud_subject import get_subject 
from .crud_user import get_user as get_user_orm

if TYPE_CHECKING:
    from app.schemas.study_plan import StudyPlanUpdate, StudyBlockUpdate


def get_study_plan(db: Session, study_plan_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.id == study_plan_id,
        models.StudyPlan.user_id == owner_id
    ).options(
        selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic),
        joinedload(models.StudyPlan.subject)
    ).first()
    # Debugging removed for brevity
    return plan

def get_active_study_plan_for_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.subject_id == subject_id,
        models.StudyPlan.user_id == owner_id,
        models.StudyPlan.status == StudyPlanStatus.ACTIVE
    ).options(
        selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic),
        joinedload(models.StudyPlan.subject)
    ).first()
    # Debugging removed for brevity
    return plan

def create_study_plan_with_blocks(
    db: Session,
    subject_id: int,
    owner_id: int,
    name: Optional[str] = None,
    force_regenerate: bool = False
) -> Optional[models.StudyPlan]:
    
    user_orm = get_user_orm(db, user_id=owner_id)
    if not user_orm: return None
 
    subject = get_subject(db, subject_id=subject_id, owner_id=owner_id)
    if not subject: return None

    existing_active_plan = get_active_study_plan_for_subject(db, subject_id, owner_id)
    plan_was_newly_created = False # Flag na sledovanie, či sme vytvorili úplne nový plán

    if existing_active_plan and not force_regenerate:
        planned_topic_ids = {b.topic_id for b in existing_active_plan.study_blocks}
        newly_added_uncompleted_topics = [
            t for t in subject.topics 
            if t.id not in planned_topic_ids and t.status != TopicStatus.COMPLETED
        ]
        if newly_added_uncompleted_topics:
            last_scheduled_date = datetime.utcnow().date()
            if existing_active_plan.study_blocks:
                valid_dates = [b.scheduled_at.date() for b in existing_active_plan.study_blocks if b.scheduled_at]
                if valid_dates: last_scheduled_date = max(valid_dates)
            current_scheduled_date = last_scheduled_date + timedelta(days=1)
            for topic_orm_obj in newly_added_uncompleted_topics:
                new_block = models.StudyBlock(
                    scheduled_at=datetime.combine(current_scheduled_date, datetime.min.time()),
                    duration_minutes=60, status=StudyBlockStatus.PLANNED, topic_id=topic_orm_obj.id,
                )
                existing_active_plan.study_blocks.append(new_block)
                current_scheduled_date += timedelta(days=1)
            db.add(existing_active_plan); db.commit()
        return get_study_plan(db, existing_active_plan.id, owner_id)

    if existing_active_plan and force_regenerate:
        existing_active_plan.status = StudyPlanStatus.ARCHIVED
        db.add(existing_active_plan)

    plan_name = name or f"Študijný plán pre {subject.name}"
    if force_regenerate and existing_active_plan: plan_name += " (nový)"
    
    db_study_plan = models.StudyPlan(
        name=plan_name, user_id=owner_id, subject_id=subject_id, status=StudyPlanStatus.ACTIVE
    )
    db.add(db_study_plan)
    plan_was_newly_created = True # Označ, že sme vytvorili nový plán

    topics_to_plan_for_new_plan = [topic for topic in subject.topics if topic.status != TopicStatus.COMPLETED]
    if not topics_to_plan_for_new_plan:
        db.commit(); db.refresh(db_study_plan)
    else:
        current_scheduled_date = datetime.utcnow().date() + timedelta(days=1)
        for topic_orm_obj in topics_to_plan_for_new_plan:
            new_block = models.StudyBlock(
                scheduled_at=datetime.combine(current_scheduled_date, datetime.min.time()), 
                duration_minutes=60, status=StudyBlockStatus.PLANNED, topic_id=topic_orm_obj.id
            )
            db_study_plan.study_blocks.append(new_block)
            current_scheduled_date += timedelta(days=1)
        db.commit()

    # Udeľ achievement "Generátor Plánov" len ak bol plán *novo* vytvorený
    if plan_was_newly_created and user_orm:
        gen_plan_def = next((item for item in ALL_ACHIEVEMENTS_DEFINITIONS if item["name"] == "Generátor Plánov"), None)
        if gen_plan_def:
            ach_obj = get_or_create_achievement(db, gen_plan_def["name"], gen_plan_def["description"], gen_plan_def["icon_name"], gen_plan_def["criteria_type"], gen_plan_def["criteria_value"])
            grant_achievement_if_not_exists(db, user_orm, ach_obj) # Commit je v grant_achievement_if_not_exists
            
    return get_study_plan(db, db_study_plan.id, owner_id)

def update_study_plan(db: Session, study_plan_id: int, plan_update: 'StudyPlanUpdate', owner_id: int) -> Optional[models.StudyPlan]:
    db_plan = get_study_plan(db, study_plan_id, owner_id)
    if not db_plan: return None
    update_data = plan_update.model_dump(exclude_unset=True)
    for key, value in update_data.items(): setattr(db_plan, key, value)
    db.add(db_plan); db.commit(); db.refresh(db_plan)
    return get_study_plan(db, db_plan.id, owner_id)

def get_study_block(db: Session, study_block_id: int, owner_id: int) -> Optional[models.StudyBlock]:
    return db.query(models.StudyBlock).join(models.StudyPlan).filter(
        models.StudyBlock.id == study_block_id, models.StudyPlan.user_id == owner_id
    ).options(joinedload(models.StudyBlock.topic)).first()

def update_study_block(db: Session, study_block_id: int, block_update: 'StudyBlockUpdate', owner_id: int) -> Optional[models.StudyBlock]:
    db_block = get_study_block(db, study_block_id, owner_id)
    if not db_block: return None
    update_data = block_update.model_dump(exclude_unset=True)
    for key, value in update_data.items(): setattr(db_block, key, value)
    
    if 'status' in update_data and update_data['status'] == StudyBlockStatus.COMPLETED:
         if db_block.topic and db_block.topic.status != TopicStatus.COMPLETED:
             db_block.topic.status = TopicStatus.COMPLETED
             db.add(db_block.topic)
             user_orm = get_user_orm(db, user_id=owner_id)
             if user_orm: check_and_grant_achievements(db, user_orm)
    
    db.add(db_block)
    try:
        db.commit()
        db.refresh(db_block)
        if db_block.topic: db.refresh(db_block.topic)
        return get_study_block(db, db_block.id, owner_id)
    except Exception as e:
        db.rollback(); raise e