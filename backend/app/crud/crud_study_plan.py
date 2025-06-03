# backend/app/crud/crud_study_plan.py
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional, TYPE_CHECKING
from datetime import datetime, timedelta
from ..db import models
from .crud_subject import get_subject # Pre načítanie predmetu a jeho tém
# Lokálny import pre schémy používané v tele funkcií
from ..schemas.study_plan import StudyBlockCreate 

if TYPE_CHECKING:
      from ..schemas.study_plan import StudyPlanUpdate, StudyBlockUpdate

def get_study_plan(db: Session, study_plan_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.id == study_plan_id,
        models.StudyPlan.user_id == owner_id
    ).options(
        selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic),
        joinedload(models.StudyPlan.subject)
    ).first()
    # Debug výpisy ... (ponechané z predchádzajúcej verzie)
    return plan

def get_active_study_plan_for_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.subject_id == subject_id,
        models.StudyPlan.user_id == owner_id,
        models.StudyPlan.status == models.StudyPlanStatus.ACTIVE
    ).options(
        selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic),
        joinedload(models.StudyPlan.subject)
    ).first()
    # Debug výpisy ... (ponechané z predchádzajúcej verzie)
    return plan

def create_study_plan_with_blocks(
    db: Session,
    subject_id: int,
    owner_id: int,
    name: Optional[str] = None,
    force_regenerate: bool = False # Nový parameter na vynútenie pregenerovania
) -> Optional[models.StudyPlan]:
    from . import schemas # Lokálny import

    subject = get_subject(db, subject_id=subject_id, owner_id=owner_id) # get_subject by mal načítať aj subject.topics
    if not subject:
        print(f"[DEBUG CRUD create_study_plan] Subject {subject_id} not found for owner {owner_id}")
        return None

    existing_active_plan = get_active_study_plan_for_subject(db, subject_id, owner_id)

    if existing_active_plan and not force_regenerate:
        print(f"[DEBUG CRUD create_study_plan] Active plan ID {existing_active_plan.id} found for subject {subject_id}.")
        # Skontroluj, či treba pridať nové témy do existujúceho plánu
        all_subject_topics_ids = {t.id for t in subject.topics}
        planned_topic_ids_in_active_plan = {b.topic_id for b in existing_active_plan.study_blocks}
        
        newly_added_uncompleted_topics = [
            t for t in subject.topics 
            if t.id not in planned_topic_ids_in_active_plan and t.status != models.TopicStatus.COMPLETED
        ]

        if newly_added_uncompleted_topics:
            print(f"[DEBUG CRUD create_study_plan] Found {len(newly_added_uncompleted_topics)} new uncompleted topics to add to existing plan ID {existing_active_plan.id}.")
            
            # Nájdi posledný naplánovaný dátum v existujúcom pláne, alebo začni od zajtra
            last_scheduled_date = datetime.utcnow().date()
            if existing_active_plan.study_blocks:
                valid_dates = [b.scheduled_at.date() for b in existing_active_plan.study_blocks if b.scheduled_at]
                if valid_dates:
                    last_scheduled_date = max(valid_dates)
            
            current_scheduled_date = last_scheduled_date + timedelta(days=1)

            for i, topic_orm_obj in enumerate(newly_added_uncompleted_topics):
                scheduled_datetime = datetime.combine(current_scheduled_date, datetime.min.time())
                print(f"  Adding block {i+1} for new Topic ID {topic_orm_obj.id} ('{topic_orm_obj.name}') scheduled for {scheduled_datetime}")
                new_block = models.StudyBlock(
                    scheduled_at=scheduled_datetime,
                    duration_minutes=60,
                    status=models.StudyBlockStatus.PLANNED,
                    topic_id=topic_orm_obj.id,
                )
                existing_active_plan.study_blocks.append(new_block)
                current_scheduled_date += timedelta(days=1)
            
            db.add(existing_active_plan) # Pridaj zmenený plán do session
            db.commit()
            print(f"[DEBUG CRUD create_study_plan] Committed updates to existing plan ID {existing_active_plan.id}.")
            # Načítaj plán znova, aby sa prejavili zmeny a eager loading
            return get_study_plan(db, existing_active_plan.id, owner_id)
        else:
            print(f"[DEBUG CRUD create_study_plan] No new topics to add to existing plan. Returning it as is.")
            return get_study_plan(db, existing_active_plan.id, owner_id) # Vráť existujúci, plne načítaný

    # Ak neexistuje aktívny plán ALEBO je force_regenerate=True
    if existing_active_plan and force_regenerate:
        print(f"[DEBUG CRUD create_study_plan] Force regenerate: Archiving old plan ID {existing_active_plan.id}")
        existing_active_plan.status = models.StudyPlanStatus.ARCHIVED
        db.add(existing_active_plan)
        # db.commit() # Commitni archiváciu pred vytvorením nového

    # Vytvorenie úplne nového plánu
    plan_name = name or f"Študijný plán pre {subject.name} (nový)"
    print(f"[DEBUG CRUD create_study_plan] Creating new plan: '{plan_name}' for subject '{subject.name}' (ID: {subject.id})")
    db_study_plan = models.StudyPlan(
        name=plan_name, user_id=owner_id, subject_id=subject_id, status=models.StudyPlanStatus.ACTIVE
    )
    db.add(db_study_plan)

    topics_to_plan_for_new_plan = [topic for topic in subject.topics if topic.status != models.TopicStatus.COMPLETED]
    print(f"[DEBUG CRUD create_study_plan] For new plan: Found {len(topics_to_plan_for_new_plan)} topics to plan.")

    if not topics_to_plan_for_new_plan:
        db.commit()
        db.refresh(db_study_plan)
        return get_study_plan(db, db_study_plan.id, owner_id)

    current_scheduled_date = datetime.utcnow().date() + timedelta(days=1)
    for i, topic_orm_obj in enumerate(topics_to_plan_for_new_plan):
        scheduled_datetime = datetime.combine(current_scheduled_date, datetime.min.time())
        new_block = models.StudyBlock(
            scheduled_at=scheduled_datetime, duration_minutes=60, status=models.StudyBlockStatus.PLANNED,
            topic_id=topic_orm_obj.id
        )
        db_study_plan.study_blocks.append(new_block)
        current_scheduled_date += timedelta(days=1)
    
    print(f"[DEBUG CRUD create_study_plan] Committing new plan and {len(db_study_plan.study_blocks)} blocks...")
    db.commit()
    print(f"[DEBUG CRUD create_study_plan] Commit successful. New Plan ID after commit: {db_study_plan.id}")
    return get_study_plan(db, db_study_plan.id, owner_id)

def update_study_plan(db: Session, study_plan_id: int, plan_update: 'schemas.StudyPlanUpdate', owner_id: int) -> Optional[models.StudyPlan]:
    db_plan = get_study_plan(db, study_plan_id, owner_id)
    if not db_plan:
        return None
    update_data = plan_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return get_study_plan(db, db_plan.id, owner_id)

# --- StudyBlock CRUD ---
def get_study_block(db: Session, study_block_id: int, owner_id: int) -> Optional[models.StudyBlock]:
    return db.query(models.StudyBlock).join(models.StudyPlan).filter(
        models.StudyBlock.id == study_block_id,
        models.StudyPlan.user_id == owner_id
    ).options(joinedload(models.StudyBlock.topic)).first()

def update_study_block(db: Session, study_block_id: int, block_update: 'schemas.StudyBlockUpdate', owner_id: int) -> Optional[models.StudyBlock]:
    db_block = get_study_block(db, study_block_id, owner_id)
    if not db_block:
        return None
    update_data = block_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_block, key, value)
    if 'status' in update_data and update_data['status'] == models.StudyBlockStatus.COMPLETED:
        if db_block.topic and db_block.topic.status != models.TopicStatus.COMPLETED:
            db_block.topic.status = models.TopicStatus.COMPLETED
            db.add(db_block.topic)
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    if db_block.topic:
        db.refresh(db_block.topic)
    return get_study_block(db, db_block.id, owner_id)