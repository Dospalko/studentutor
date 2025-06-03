# backend/app/routers/study_plans.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

# Aktualizované importy
from ..database import get_db
from ..dependencies import get_current_active_user
from ..db import models as db_models # ORM modely
from ..schemas import study_plan as study_plan_schemas # Pydantic schémy pre študijné plány
from ..schemas import subject as subject_schemas # Ak by bolo treba
from ..crud import crud_study_plan, crud_subject # CRUD operácie

router = APIRouter(
    prefix="/study-plans",
    tags=["study_plans"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=study_plan_schemas.StudyPlan, status_code=status.HTTP_201_CREATED)
def generate_or_get_study_plan_for_subject(
    plan_create: study_plan_schemas.StudyPlanCreate,
    force_regenerate: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user) # Použi db_models.User
):
    subject = crud_subject.get_subject(db, subject_id=plan_create.subject_id, owner_id=current_user.id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")

    plan = crud_study_plan.create_study_plan_with_blocks(
        db=db,
        subject_id=plan_create.subject_id,
        owner_id=current_user.id,
        name=plan_create.name,
        force_regenerate=force_regenerate
    )
    
    if not plan:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process study plan.")

    # `plan` je ORM model. `subject_name` by sa mal doplniť, ak ho CRUD vráti, alebo ho doplníme tu.
    # Pydantic `response_model` zabezpečí konverziu ORM -> Schéma.
    # Ak `plan.subject` je eager-loadnutý v CRUD, môžeme pristúpiť k `plan.subject.name`
    if hasattr(plan, 'subject') and plan.subject: # Bezpečná kontrola
        setattr(plan, 'subject_name', plan.subject.name) # Nastavíme atribút pre schému, ak chýba
    elif subject: # Fallback na subject načítaný na začiatku
         setattr(plan, 'subject_name', subject.name)
        
    return plan

@router.get("/subject/{subject_id}", response_model=Optional[study_plan_schemas.StudyPlan])
def get_active_study_plan_for_subject_route(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    db_subject_check = crud_subject.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject_check:
        return None 

    plan = crud_study_plan.get_active_study_plan_for_subject(
        db,
        subject_id=subject_id,
        owner_id=current_user.id
    )
    
    if plan:
        if hasattr(plan, 'subject') and plan.subject:
            setattr(plan, 'subject_name', plan.subject.name)
        elif db_subject_check:
            setattr(plan, 'subject_name', db_subject_check.name)
        # print(f"Router: Returning active plan ID {plan.id} for subject ID {subject_id}")
    # else:
        # print(f"Router: No active plan found for subject ID {subject_id}")
        
    return plan


@router.get("/{plan_id}", response_model=study_plan_schemas.StudyPlan)
def get_study_plan_by_id_route(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    plan = crud_study_plan.get_study_plan(db, study_plan_id=plan_id, owner_id=current_user.id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study plan with ID {plan_id} not found or not owned by user"
        )
    
    if hasattr(plan, 'subject') and plan.subject:
        setattr(plan, 'subject_name', plan.subject.name)
    # print(f"Router: Returning plan ID {plan.id}")
    return plan


@router.put("/blocks/{block_id}", response_model=study_plan_schemas.StudyBlock)
def update_study_block_route(
    block_id: int,
    block_update: study_plan_schemas.StudyBlockUpdate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    updated_block = crud_study_plan.update_study_block(
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
    # print(f"Router: Updated study block ID {updated_block.id}")
    return updated_block