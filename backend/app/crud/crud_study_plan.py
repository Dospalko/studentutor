# backend/app/crud/crud_study_plan.py
from sqlalchemy import Tuple
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional, TYPE_CHECKING
from datetime import datetime, timedelta

from app.db import models
from app.db.enums import StudyPlanStatus, StudyBlockStatus, TopicStatus

# Import CRUD funkcií
from .crud_subject import get_subject 
# get_user_orm by mal byť v crud_user.py
# from .crud_user import get_user as get_user_orm # Ak ho tu priamo potrebuješ

if TYPE_CHECKING:
    from app.schemas.study_plan import StudyPlanUpdate, StudyBlockCreate, StudyBlockUpdate # Pridaj StudyBlockCreate

def get_study_plan(db: Session, study_plan_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.id == study_plan_id,
        models.StudyPlan.user_id == owner_id
    ).options(
        selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic),
        joinedload(models.StudyPlan.subject) # Načítaj aj predmet plánu
    ).first()
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
    return plan

def create_study_plan_with_blocks(
    db: Session,
    subject_id: int,
    owner_id: int,
    name: Optional[str] = None,
    force_regenerate: bool = False
) -> Tuple[Optional[models.StudyPlan], bool]: # Vráti aj flag, či bol plán novo vytvorený
    
    # `get_subject` by mal načítať `subject.topics` vďaka selectinload
    subject = get_subject(db, subject_id=subject_id, owner_id=owner_id)
    if not subject:
        return None, False

    existing_active_plan = get_active_study_plan_for_subject(db, subject_id, owner_id)
    plan_was_newly_created_or_forced = False

    if existing_active_plan and not force_regenerate:
        # Logika pre aktualizáciu existujúceho plánu pridaním nových tém
        planned_topic_ids = {b.topic_id for b in existing_active_plan.study_blocks}
        newly_added_uncompleted_topics = [
            t for t in subject.topics 
            if t.id not in planned_topic_ids and t.status != TopicStatus.COMPLETED
        ]
        if newly_added_uncompleted_topics:
            plan_was_newly_created_or_forced = True # Považujeme za "významnú" zmenu
            last_scheduled_date = datetime.utcnow().date()
            if existing_active_plan.study_blocks:
                valid_dates = [b.scheduled_at.date() for b in existing_active_plan.study_blocks if b.scheduled_at]
                if valid_dates: last_scheduled_date = max(valid_dates)
            current_scheduled_date = last_scheduled_date + timedelta(days=1)

            for topic_orm_obj in newly_added_uncompleted_topics:
                duration_minutes = topic_orm_obj.ai_estimated_duration or 60 # Použi AI odhad
                new_block = models.StudyBlock(
                    scheduled_at=datetime.combine(current_scheduled_date, datetime.min.time()),
                    duration_minutes=duration_minutes, 
                    status=StudyBlockStatus.PLANNED, 
                    topic_id=topic_orm_obj.id,
                )
                existing_active_plan.study_blocks.append(new_block)
                days_to_advance = 1
                if topic_orm_obj.ai_difficulty_score is not None and topic_orm_obj.ai_difficulty_score > 0.7:
                    days_to_advance = 2
                current_scheduled_date += timedelta(days=days_to_advance)
            
            db.add(existing_active_plan)
            db.commit()
        return get_study_plan(db, existing_active_plan.id, owner_id), plan_was_newly_created_or_forced

    # Vytvorenie nového plánu (alebo vynútené pregenerovanie)
    if existing_active_plan and force_regenerate:
        existing_active_plan.status = StudyPlanStatus.ARCHIVED
        db.add(existing_active_plan)
        plan_was_newly_created_or_forced = True 
        # Zatiaľ necommitujeme, commitneme spolu s novým plánom
    
    if not existing_active_plan : # Ak neexistoval žiadny aktívny
        plan_was_newly_created_or_forced = True

    plan_name_base = name or f"Študijný plán pre {subject.name}"
    plan_name = plan_name_base + " (nový)" if force_regenerate and existing_active_plan else plan_name_base
    
    db_study_plan = models.StudyPlan(
        name=plan_name, user_id=owner_id, subject_id=subject_id, status=StudyPlanStatus.ACTIVE
    )
    db.add(db_study_plan)

    # Zoradenie tém podľa AI náročnosti pre nový plán
    topics_to_plan = sorted(
        [topic for topic in subject.topics if topic.status != TopicStatus.COMPLETED],
        key=lambda t: (t.ai_difficulty_score if t.ai_difficulty_score is not None else 0.5)
    )

    if not topics_to_plan:
        db.commit()
        db.refresh(db_study_plan)
    else:
        current_scheduled_date = datetime.utcnow().date() + timedelta(days=1)
        for topic_orm_obj in topics_to_plan:
            duration_minutes = topic_orm_obj.ai_estimated_duration or 60
            new_block = models.StudyBlock(
                scheduled_at=datetime.combine(current_scheduled_date, datetime.min.time()), 
                duration_minutes=duration_minutes, 
                status=StudyBlockStatus.PLANNED, 
                topic_id=topic_orm_obj.id
            )
            db_study_plan.study_blocks.append(new_block)
            days_to_advance = 1
            if topic_orm_obj.ai_difficulty_score is not None and topic_orm_obj.ai_difficulty_score > 0.7:
                days_to_advance = 2
            current_scheduled_date += timedelta(days=days_to_advance)
        db.commit()
            
    return get_study_plan(db, db_study_plan.id, owner_id), plan_was_newly_created_or_forced

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
    db_block = get_study_block(db, study_block_id, owner_id) # Načíta blok aj s témou
    if not db_block: return None
    
    original_topic_status = db_block.topic.status if db_block.topic else None
    
    update_data = block_update.model_dump(exclude_unset=True)
    for key, value in update_data.items(): setattr(db_block, key, value)
    
    block_became_completed = False
    if 'status' in update_data and update_data['status'] == StudyBlockStatus.COMPLETED:
         if db_block.topic and db_block.topic.status != TopicStatus.COMPLETED:
             db_block.topic.status = TopicStatus.COMPLETED
             db.add(db_block.topic)
             block_became_completed = True # Indikátor pre router, aby zavolal achievement check pre témy
    
    db.add(db_block)
    try:
        db.commit()
        db.refresh(db_block)
        if db_block.topic: db.refresh(db_block.topic) # Obnov aj tému, ak bola modifikovaná
        
        # Vráť blok spolu s informáciou, či jeho dokončenie zmenilo status témy
        # Router to potom použije na rozhodnutie, ktoré achievementy kontrolovať
        # Toto je len návrh, ako by sa to dalo riešiť.
        # setattr(db_block, '_topic_status_changed_to_completed', block_became_completed and (original_topic_status != TopicStatus.COMPLETED))
        return get_study_block(db, db_block.id, owner_id) # Vráť plne načítaný blok
    except Exception as e:
        db.rollback(); raise e