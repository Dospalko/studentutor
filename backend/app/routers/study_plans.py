# backend/app/routers/study_plans.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/study-plans",
    tags=["study_plans"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=schemas.StudyPlan, status_code=status.HTTP_201_CREATED)
def generate_or_get_study_plan_for_subject(
    plan_create: schemas.StudyPlanCreate,
    force_regenerate: Optional[bool] = False, # Nový query parameter
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    subject = crud.get_subject(db, subject_id=plan_create.subject_id, owner_id=current_user.id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")

    # CRUD funkcia teraz obsahuje logiku pre existujúci vs. nový plán
    plan = crud.create_study_plan_with_blocks(
        db=db,
        subject_id=plan_create.subject_id,
        owner_id=current_user.id,
        name=plan_create.name,
        force_regenerate=force_regenerate # Posuň parameter ďalej
    )
    
    if not plan:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process study plan.")

    if plan.subject:
        plan.subject_name = plan.subject.name
    elif subject:
         plan.subject_name = subject.name
        
    return plan

@router.get("/subject/{subject_id}", response_model=Optional[schemas.StudyPlan])
def get_active_study_plan_for_subject_route(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_subject_check = crud.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject_check:
        return None # Alebo 404 ak predmet neexistuje

    plan = crud.get_active_study_plan_for_subject(
        db,
        subject_id=subject_id,
        owner_id=current_user.id
    )
    
    if plan:
        if plan.subject: # Malo by byť už načítané
            plan.subject_name = plan.subject.name
        elif db_subject_check: # Fallback
            plan.subject_name = db_subject_check.name
        print(f"Router: Returning active plan ID {plan.id} for subject ID {subject_id}")
    else:
        print(f"Router: No active plan found for subject ID {subject_id}")
        
    return plan


@router.get("/{plan_id}", response_model=schemas.StudyPlan)
def get_study_plan_by_id_route(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    plan = crud.get_study_plan(db, study_plan_id=plan_id, owner_id=current_user.id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study plan with ID {plan_id} not found or not owned by user"
        )
    
    if plan.subject: # Malo by byť už načítané
        plan.subject_name = plan.subject.name
    # Fallback nie je až taký kritický tu, lebo ak plán existuje, mal by mať aj subject

    print(f"Router: Returning plan ID {plan.id}")
    return plan


@router.put("/blocks/{block_id}", response_model=schemas.StudyBlock)
def update_study_block_route(
    block_id: int,
    block_update: schemas.StudyBlockUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    updated_block = crud.update_study_block(
        db,
        study_block_id=block_id,
        block_update=block_update,
        owner_id=current_user.id
    )
    if not updated_block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study block with ID {block_id} not found or not authorized to update"
        )
    print(f"Router: Updated study block ID {updated_block.id}")
    return updated_block