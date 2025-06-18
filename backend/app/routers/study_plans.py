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
    force_regenerate: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    subject = crud_subject.get_subject(db, subject_id=plan_create.subject_id, owner_id=current_user.id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")

    # Volanie CRUD funkcie, ktorá vracia tuple: (plan_object, was_newly_created_flag)
    plan_orm_object, was_newly_created_or_significantly_changed = crud_study_plan.create_study_plan_with_blocks(
        db=db,
        subject_id=plan_create.subject_id,
        owner_id=current_user.id,
        name=plan_create.name,
        force_regenerate=force_regenerate
    )
    
    if not plan_orm_object: # Ak CRUD funkcia vrátila None pre plán
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process study plan.")

    # Kontrola achievementov na základe flagu z CRUD funkcie
    if was_newly_created_or_significantly_changed:
        # Tento achievement sa udeľuje, ak bol plán naozaj nový alebo pregenerovaný,
        # alebo ak sa do existujúceho pridali nové témy.
        check_and_grant_achievements(db, current_user, AchievementCriteriaType.FIRST_PLAN_GENERATED)
        # Pre PLANS_GENERATED_OR_UPDATED (ak by si sledoval počet) by sa tu tiež kontrolovalo.
        # check_and_grant_achievements(db, current_user, AchievementCriteriaType.PLANS_GENERATED_OR_UPDATED)
            
    # Doplnenie subject_name do ORM objektu pred konverziou na Pydantic schému
    # CRUD funkcia get_study_plan (ktorú volá create_study_plan_with_blocks na konci)
    # by už mala načítať subject, takže plan_orm_object.subject by malo existovať.
    if hasattr(plan_orm_object, 'subject') and plan_orm_object.subject:
        setattr(plan_orm_object, 'subject_name', plan_orm_object.subject.name)
    elif subject: # Fallback, ak by náhodou nebol subject načítaný s plánom
         setattr(plan_orm_object, 'subject_name', subject.name)
        
    return plan_orm_object # FastAPI skonvertuje tento ORM objekt na schému schemas.StudyPlan

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