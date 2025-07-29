# backend/app/routers/study_plans.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_active_user
from app.db import models as db_models # ORM modely
from app.schemas import study_plan as study_plan_schemas # Pydantic schémy pre študijné plány
from app.schemas import subject as subject_schemas # Ak by bolo treba pre typovanie
from app.crud import crud_study_plan, crud_subject # CRUD operácie
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
    force_regenerate: bool | None = False,
    use_ai: bool = True,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user),
):
    subject = crud_subject.get_subject(db, subject_id=plan_create.subject_id, owner_id=current_user.id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    plan, was_new = crud_study_plan.create_study_plan_with_blocks(
        db=db,
        subject_id=plan_create.subject_id,
        owner_id=current_user.id,
        name=plan_create.name,
        force_regenerate=force_regenerate,
        use_ai=use_ai,
    )
    if not plan:
        raise HTTPException(status_code=500, detail="Plan error")

    if was_new:
        check_and_grant_achievements(db, current_user, AchievementCriteriaType.FIRST_PLAN_GENERATED)

    if plan.subject:
        setattr(plan, "subject_name", plan.subject.name)
    else:
        setattr(plan, "subject_name", subject.name)
    return plan

@router.put("/blocks/{block_id}", response_model=study_plan_schemas.StudyBlock)
def update_study_block_route(
    block_id: int,
    block_update: study_plan_schemas.StudyBlockUpdate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    original_block = crud_study_plan.get_study_block(db, study_block_id=block_id, owner_id=current_user.id)
    if not original_block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study block not found")
    
    original_topic_status_before_update = original_block.topic.status if original_block.topic else None

    updated_block_orm = crud_study_plan.update_study_block(
        db, study_block_id=block_id, block_update=block_update, owner_id=current_user.id
    )
    if not updated_block_orm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study block not found or update failed")

    # Kontrola achievementov po aktualizácii bloku
    if updated_block_orm.status == StudyBlockStatus.COMPLETED:
        check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOTAL_STUDY_BLOCKS_COMPLETED)
        
        # Skontroluj, či sa status témy zmenil na COMPLETED vďaka tomuto bloku
        if updated_block_orm.topic and \
           updated_block_orm.topic.status == TopicStatus.COMPLETED and \
           original_topic_status_before_update != TopicStatus.COMPLETED:
            
            check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOPICS_COMPLETED)
            check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOPICS_IN_SUBJECT_COMPLETED_PERCENT)
            check_and_grant_achievements(db, current_user, AchievementCriteriaType.SUBJECT_FULLY_COMPLETED)
            
    return updated_block_orm

@router.get("/subject/{subject_id}", response_model=Optional[study_plan_schemas.StudyPlan])
def get_active_study_plan_for_subject_route(
    subject_id: int, 
    db: Session = Depends(get_db), 
    current_user: db_models.User = Depends(get_current_active_user)
):
    db_subject_check = crud_subject.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject_check: 
        return None 

    plan_orm = crud_study_plan.get_active_study_plan_for_subject(db, subject_id=subject_id, owner_id=current_user.id)
    
    if plan_orm:
        if hasattr(plan_orm, 'subject') and plan_orm.subject:
            setattr(plan_orm, 'subject_name', plan_orm.subject.name)
        elif db_subject_check: # Fallback
            setattr(plan_orm, 'subject_name', db_subject_check.name)
    return plan_orm

@router.get("/{plan_id}", response_model=study_plan_schemas.StudyPlan)
def get_study_plan_by_id_route(
    plan_id: int, 
    db: Session = Depends(get_db), 
    current_user: db_models.User = Depends(get_current_active_user)
):
    plan_orm = crud_study_plan.get_study_plan(db, study_plan_id=plan_id, owner_id=current_user.id)
    if not plan_orm: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Study plan with ID {plan_id} not found")
    
    if hasattr(plan_orm, 'subject') and plan_orm.subject:
        setattr(plan_orm, 'subject_name', plan_orm.subject.name)
    # Ak by subject nebol načítaný s plánom, museli by sme ho načítať zvlášť:
    # else:
    #     subject_for_plan = crud_subject.get_subject(db, subject_id=plan_orm.subject_id, owner_id=current_user.id)
    #     if subject_for_plan:
    #         setattr(plan_orm, 'subject_name', subject_for_plan.name)
            
    return plan_orm