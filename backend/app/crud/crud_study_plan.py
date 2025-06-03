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
      # Debug výpisy (môžeš ich neskôr odstrániť)
      if plan: print(f"[CRUD get_study_plan] Plan ID: {plan.id}, Blocks: {len(plan.study_blocks)}")
      return plan

def get_active_study_plan_for_subject(db: Session, subject_id: int, owner_id: int) -> Optional[models.StudyPlan]:
      plan = db.query(models.StudyPlan).filter(
          models.StudyPlan.subject_id == subject_id,
          models.StudyPlan.user_id == owner_id,
          models.StudyPlan.status == models.StudyPlanStatus.ACTIVE # Použi enum z models
      ).options(
          selectinload(models.StudyPlan.study_blocks).selectinload(models.StudyBlock.topic),
          joinedload(models.StudyPlan.subject)
      ).first()
      # Debug výpisy ...
      return plan
  
def create_study_plan_with_blocks(
      db: Session,
      subject_id: int,
      owner_id: int,
      name: Optional[str] = None,
      force_regenerate: bool = False
  ) -> Optional[models.StudyPlan]:
      subject = get_subject(db, subject_id=subject_id, owner_id=owner_id)
      if not subject:
          return None

      existing_active_plan = get_active_study_plan_for_subject(db, subject_id, owner_id)

      if existing_active_plan and not force_regenerate:
          # ... (logika pre aktualizáciu existujúceho plánu - skopíruj z predchádzajúcej verzie) ...
          # Namiesto kopírovania celého bloku, tu je princíp:
          planned_topic_ids = {b.topic_id for b in existing_active_plan.study_blocks}
          newly_added = [t for t in subject.topics if t.id not in planned_topic_ids and t.status != models.TopicStatus.COMPLETED]
          if newly_added:
              # ... (pridaj nové bloky do existing_active_plan.study_blocks) ...
              db.add(existing_active_plan)
              db.commit()
          return get_study_plan(db, existing_active_plan.id, owner_id)


      if existing_active_plan and force_regenerate:
          existing_active_plan.status = models.StudyPlanStatus.ARCHIVED # Použi enum z models
          db.add(existing_active_plan)

      plan_name = name or f"Študijný plán pre {subject.name}"
      db_study_plan = models.StudyPlan(
          name=plan_name, user_id=owner_id, subject_id=subject_id, status=models.StudyPlanStatus.ACTIVE # enum
      )
      db.add(db_study_plan) # Pridaj do session

      topics_to_plan = [t for t in subject.topics if t.status != models.TopicStatus.COMPLETED] # enum
      if not topics_to_plan:
          db.commit(); db.refresh(db_study_plan)
          return get_study_plan(db, db_study_plan.id, owner_id)

      current_scheduled_date = datetime.utcnow().date() + timedelta(days=1)
      for topic_orm_obj in topics_to_plan:
          block_data = StudyBlockCreate( # Použitie importovanej schémy
              topic_id=topic_orm_obj.id,
              scheduled_at=datetime.combine(current_scheduled_date, datetime.min.time()),
              duration_minutes=60,
              status=models.StudyBlockStatus.PLANNED # enum
          )
          new_block = models.StudyBlock(
              scheduled_at=block_data.scheduled_at,
              duration_minutes=block_data.duration_minutes,
              status=block_data.status,
              topic_id=topic_orm_obj.id,
          )
          db_study_plan.study_blocks.append(new_block)
          current_scheduled_date += timedelta(days=1)
      
      db.commit()
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
      
      if 'status' in update_data and update_data['status'] == models.StudyBlockStatus.COMPLETED: # enum
          if db_block.topic and db_block.topic.status != models.TopicStatus.COMPLETED: # enum
              db_block.topic.status = models.TopicStatus.COMPLETED # enum
              db.add(db_block.topic)
      
      db.add(db_block); db.commit(); db.refresh(db_block)
      if db_block.topic: db.refresh(db_block.topic)
      return get_study_block(db, db_block.id, owner_id)
