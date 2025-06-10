# backend/app/crud/crud_study_plan.py
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional, TYPE_CHECKING
from datetime import datetime, timedelta

from backend.app.services.achievement_service import check_and_grant_achievements

# Import ORM modelov
from ..db import models

# Import Enumov z ich nového umiestnenia
from ..db.enums import StudyPlanStatus, StudyBlockStatus, TopicStatus 

# Import CRUD funkcií, ktoré potrebujeme (napr. get_subject)
from .crud_subject import get_subject 

# Import Pydantic schém, ktoré sa používajú na vytváranie inštancií v tele funkcií
from ..schemas.study_plan import StudyBlockCreate # Ak StudyBlockCreate používame na vytvorenie inštancie
from .crud_user import get_user as get_user_orm
# Pre typové anotácie parametrov funkcií (aby sa predišlo cyklickým importom pri štarte)
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
    if plan:
        print(f"[DEBUG CRUD get_study_plan] Plan ID: {plan.id}, Blocks: {len(plan.study_blocks)}")
        for i, block in enumerate(plan.study_blocks):
            topic_name = block.topic.name if block.topic else "N/A (ERROR - Topic not loaded or missing)"
            print(f"  Block {i} ID: {block.id}, Topic ID: {block.topic_id}, Topic Name: '{topic_name}'")
    else:
        print(f"[DEBUG CRUD get_study_plan] Plan ID: {study_plan_id} not found for owner {owner_id}")
    return plan

def get_active_study_plan_for_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.StudyPlan]:
    plan = db.query(models.StudyPlan).filter(
        models.StudyPlan.subject_id == subject_id,
        models.StudyPlan.user_id == owner_id,
        models.StudyPlan.status == StudyPlanStatus.ACTIVE # Použitie importovaného enumu
    ).options(
        selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic),
        joinedload(models.StudyPlan.subject)
    ).first()
    if plan:
        print(f"[DEBUG CRUD get_active_study_plan] Plan ID: {plan.id} for Subj {subject_id}, Blocks: {len(plan.study_blocks)}")
        for i, block in enumerate(plan.study_blocks):
            topic_name = block.topic.name if block.topic else "N/A (ERROR - Topic not loaded or missing)"
            print(f"  Block {i} ID: {block.id}, Topic ID: {block.topic_id}, Topic Name: '{topic_name}'")
    else:
        print(f"[DEBUG CRUD get_active_study_plan] No active plan found for Subj {subject_id}, Owner {owner_id}")
    return plan

def create_study_plan_with_blocks(
        
    db: Session,
    subject_id: int,
    owner_id: int,
    name: Optional[str] = None,
    force_regenerate: bool = False
) -> Optional[models.StudyPlan]:
    user_orm = get_user_orm(db, user_id=owner_id) # Načítaj ORM usera
    if not user_orm: return None # Ak user neexistuje
 
    # `get_subject` by mal načítať aj `subject.topics` vďaka selectinload v `crud_subject.py`
    subject = get_subject(db, subject_id=subject_id, owner_id=owner_id)
    if not subject:
        print(f"[DEBUG CRUD create_study_plan] Subject {subject_id} not found for owner {owner_id}")
        return None

    existing_active_plan = get_active_study_plan_for_subject(db, subject_id, owner_id)

    if existing_active_plan and not force_regenerate:
        print(f"[DEBUG CRUD create_study_plan] Active plan ID {existing_active_plan.id} found for subject {subject_id}.")
        planned_topic_ids = {b.topic_id for b in existing_active_plan.study_blocks}
        
        newly_added_uncompleted_topics = [
            t for t in subject.topics 
            if t.id not in planned_topic_ids and t.status != TopicStatus.COMPLETED # Použitie importovaného enumu
        ]

        if newly_added_uncompleted_topics:
            print(f"[DEBUG CRUD create_study_plan] Found {len(newly_added_uncompleted_topics)} new uncompleted topics to add to existing plan ID {existing_active_plan.id}.")
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
                    status=StudyBlockStatus.PLANNED, # Použitie importovaného enumu
                    topic_id=topic_orm_obj.id,
                )
                existing_active_plan.study_blocks.append(new_block) # Pridaj do kolekcie existujúceho plánu
                current_scheduled_date += timedelta(days=1)
            
            db.add(existing_active_plan)
            db.commit()
            print(f"[DEBUG CRUD create_study_plan] Committed updates to existing plan ID {existing_active_plan.id}.")
            return get_study_plan(db, existing_active_plan.id, owner_id) # Vráť plne načítaný aktualizovaný plán
        else:
            print(f"[DEBUG CRUD create_study_plan] No new topics to add to existing plan. Returning it as is.")
            return get_study_plan(db, existing_active_plan.id, owner_id) # Vráť existujúci, plne načítaný

    # ----- Vytvorenie úplne nového plánu (ak neexistuje aktívny alebo je force_regenerate=True) -----
    if existing_active_plan and force_regenerate: # existing_active_plan je tu už plne načítaný
        print(f"[DEBUG CRUD create_study_plan] Force regenerate: Archiving old plan ID {existing_active_plan.id}")
        existing_active_plan.status = StudyPlanStatus.ARCHIVED # Použitie importovaného enumu
        db.add(existing_active_plan)
        # Zváž commit tu, ak chceš, aby archivácia bola samostatná transakcia,
        # ale pre jednoduchosť to môžeme nechať v jednej transakcii s vytvorením nového plánu.

    plan_name = name or f"Študijný plán pre {subject.name}" # Použi default, ak meno nie je poskytnuté
    if force_regenerate and existing_active_plan: # Pridaj "(nový)" len ak pregenerovávame
        plan_name += " (nový)"

    print(f"[DEBUG CRUD create_study_plan] Creating new plan: '{plan_name}' for subject '{subject.name}' (ID: {subject.id})")
    db_study_plan = models.StudyPlan(
        name=plan_name, user_id=owner_id, subject_id=subject_id, status=StudyPlanStatus.ACTIVE # Použitie enumu
    )
    db.add(db_study_plan) # Pridaj nový plán do session

    topics_to_plan_for_new_plan = [topic for topic in subject.topics if topic.status != TopicStatus.COMPLETED] # Použitie enumu
    print(f"[DEBUG CRUD create_study_plan] For new plan: Found {len(topics_to_plan_for_new_plan)} topics to plan.")

    if not topics_to_plan_for_new_plan:
        db.commit() # Commitni nový (prázdny) plán a archivovaný starý (ak bol)
        db.refresh(db_study_plan)
        return get_study_plan(db, db_study_plan.id, owner_id)

    current_scheduled_date = datetime.utcnow().date() + timedelta(days=1)
    for i, topic_orm_obj in enumerate(topics_to_plan_for_new_plan):
        scheduled_datetime = datetime.combine(current_scheduled_date, datetime.min.time())
        # Vytvárame ORM model StudyBlock, nie Pydantic schému StudyBlockCreate tu priamo
        new_block = models.StudyBlock(
            scheduled_at=scheduled_datetime, 
            duration_minutes=60, 
            status=StudyBlockStatus.PLANNED, # Použitie enumu
            topic_id=topic_orm_obj.id # Priame priradenie FK
        )
        db_study_plan.study_blocks.append(new_block) # Pridaj do kolekcie nového plánu
        current_scheduled_date += timedelta(days=1)
    
    print(f"[DEBUG CRUD create_study_plan] Committing new plan and {len(db_study_plan.study_blocks)} blocks...")
    db.commit() # Commitne nový plán, jeho bloky, a zmenu statusu starého plánu (ak bol force_regenerate)
    print(f"[DEBUG CRUD create_study_plan] Commit successful. New Plan ID after commit: {db_study_plan.id}")
    return get_study_plan(db, db_study_plan.id, owner_id) # Vráť plne načítaný nový plán

def update_study_plan(db: Session, study_plan_id: int, plan_update: 'StudyPlanUpdate', owner_id: int) -> Optional[models.StudyPlan]:
    db_plan = get_study_plan(db, study_plan_id, owner_id)
    if not db_plan: return None
    
    update_data = plan_update.model_dump(exclude_unset=True)
    for key, value in update_data.items(): 
        setattr(db_plan, key, value) # Pydantic už skonvertoval stringovú hodnotu statusu na enum, ak je v schéme
    
    db.add(db_plan); db.commit(); db.refresh(db_plan)
    return get_study_plan(db, db_plan.id, owner_id)

# --- StudyBlock CRUD ---
def get_study_block(db: Session, study_block_id: int, owner_id: int) -> Optional[models.StudyBlock]:
    return db.query(models.StudyBlock).join(models.StudyPlan).filter(
        models.StudyBlock.id == study_block_id,
        models.StudyPlan.user_id == owner_id
    ).options(joinedload(models.StudyBlock.topic)).first()

def update_study_block(db: Session, study_block_id: int, block_update: 'StudyBlockUpdate', owner_id: int) -> Optional[models.StudyBlock]:
    db_block = get_study_block(db, study_block_id, owner_id)
    if not db_block: return None
        
    update_data = block_update.model_dump(exclude_unset=True)
    for key, value in update_data.items(): 
        setattr(db_block, key, value) # Pydantic už skonvertoval stringovú hodnotu statusu na enum
    
    # Ak sa mení status na COMPLETED, aktualizuj aj tému
    if 'status' in update_data and update_data['status'] == models.StudyBlockStatus.COMPLETED:
         if db_block.topic and db_block.topic.status != models.TopicStatus.COMPLETED:
             db_block.topic.status = models.TopicStatus.COMPLETED
             db.add(db_block.topic)
             
             # Skontroluj achievementy po dokončení témy (cez blok)
             user_orm = get_user_orm(db, user_id=owner_id)
             if user_orm:
                 check_and_grant_achievements(db, user_orm) # Toto bude kontrolovať VŠETKY achievementy
    
    db.add(db_block)
    try:
        db.commit()
        db.refresh(db_block)
        if db_block.topic: db.refresh(db_block.topic)
        print(f"[DEBUG CRUD update_study_block] Successfully updated block ID {db_block.id}.")
        return get_study_block(db, db_block.id, owner_id)
    except Exception as e:
        db.rollback()
        print(f"[DEBUG CRUD update_study_block] Error committing changes for block ID {study_block_id}: {e}")
        raise