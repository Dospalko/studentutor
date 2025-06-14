# backend/app/routers/study_plans.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_active_user
from app.db import models as db_models
from app.schemas import study_plan as study_plan_schemas
from app.crud import crud_study_plan, crud_subject
from app.services.achievement_service import check_and_grant_achievements
from app.db.enums import AchievementCriteriaType, StudyBlockStatus, TopicStatus

router = APIRouter(
    prefix="/study-plans",
    tags=["Study Plans"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=study_plan_schemas.StudyPlan, status_code=status.HTTP_201_CREATED)
def generate_or_get_study_plan_for_subject(
    plan_create: study_plan_schemas.StudyPlanCreate,
    force_regenerate: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    subject = crud_subject.get_subject(db, subject_id=plan_create.subject_id, owner_id=current_user.id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")

    # Zisti, či užívateľ už má nejaký plán (pre FIRST_PLAN_GENERATED)
    # Toto je jednoduchá kontrola, presnejšie by bolo sledovať, či tento konkrétny POST vytvoril nový plán.
    had_plan_before = db.query(db_models.StudyPlan.id).filter(db_models.StudyPlan.user_id == current_user.id).first() is not None

    plan = crud_study_plan.create_study_plan_with_blocks(
        db=db,
        subject_id=plan_create.subject_id,
        owner_id=current_user.id,
        name=plan_create.name,
        force_regenerate=force_regenerate
    )
    
    if not plan:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process study plan.")

    # Ak predtým nemal plán a teraz ho má (alebo bol force_regenerate)
    if not had_plan_before or force_regenerate:
        check_and_grant_achievements(db, current_user, AchievementCriteriaType.FIRST_PLAN_GENERATED)
    
    # Pre PLANS_GENERATED_OR_UPDATED by bolo treba inkrementovať počítadlo
    # a potom skontrolovať. Zatiaľ to tu necháme takto jednoducho.
    # check_and_grant_achievements(db, current_user, AchievementCriteriaType.PLANS_GENERATED_OR_UPDATED)
            
    if hasattr(plan, 'subject') and plan.subject:
        setattr(plan, 'subject_name', plan.subject.name)
    elif subject:
         setattr(plan, 'subject_name', subject.name)
        
    return plan

@router.put("/blocks/{block_id}", response_model=study_plan_schemas.StudyBlock)
def update_study_block_route(
    block_id: int,
    block_update: study_plan_schemas.StudyBlockUpdate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    # Získaj pôvodný blok, aby sme vedeli jeho pôvodný status témy, ak sa mení
    original_block = crud_study_plan.get_study_block(db, study_block_id=block_id, owner_id=current_user.id)
    if not original_block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study block not found")
    
    original_topic_status = original_block.topic.status if original_block.topic else None

    updated_block = crud_study_plan.update_study_block(
        db, study_block_id=block_id, block_update=block_update, owner_id=current_user.id
    )
    if not updated_block: # Toto by už nemalo nastať, ak original_block existoval
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study block not found or not authorized to update")

    if updated_block.status == StudyBlockStatus.COMPLETED:
        check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOTAL_STUDY_BLOCKS_COMPLETED)
        # CRUD pre blok by mal aktualizovať aj status témy. Skontrolujeme achievementy pre témy.
        # Ak sa status témy zmenil na COMPLETED
        if updated_block.topic and updated_block.topic.status == TopicStatus.COMPLETED and original_topic_status != TopicStatus.COMPLETED:
            check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOPICS_COMPLETED)
            check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOPICS_IN_SUBJECT_COMPLETED_PERCENT)
            check_and_grant_achievements(db, current_user, AchievementCriteriaType.SUBJECT_FULLY_COMPLETED)
            
    return updated_block

@router.get("/subject/{subject_id}", response_model=Optional[study_plan_schemas.StudyPlan])
def get_active_study_plan_for_subject_route(subject_id: int, db: Session = Depends(get_db), current_user: db_models.User = Depends(get_current_active_user)):
    db_subject_check = crud_subject.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject_check: return None 
    plan = crud_study_plan.get_active_study_plan_for_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if plan:
        if hasattr(plan, 'subject') and plan.subject: setattr(plan, 'subject_name', plan.subject.name)
        elif db_subject_check: setattr(plan, 'subject_name', db_subject_check.name)
    return plan

@router.get("/{plan_id}", response_model=study_plan_schemas.StudyPlan)
def get_study_plan_by_id_route(plan_id: int, db: Session = Depends(get_db), current_user: db_models.User = Depends(get_current_active_user)):
    plan = crud_study_plan.get_study_plan(db, study_plan_id=plan_id, owner_id=current_user.id)
    if not plan: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Study plan with ID {plan_id} not found")
    if hasattr(plan, 'subject') and plan.subject: setattr(plan, 'subject_name', plan.subject.name)
    return plan