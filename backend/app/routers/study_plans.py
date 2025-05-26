# backend/app/routers/study_plans.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional # Optional pre query parametre

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/study-plans",
    tags=["study_plans"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=schemas.StudyPlan, status_code=status.HTTP_201_CREATED)
def generate_study_plan_for_subject(
    plan_create: schemas.StudyPlanCreate, # Očakáva subject_id a voliteľne name
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Skontroluj, či predmet existuje a patrí používateľovi (aj keď to robí aj CRUD)
    subject = crud.get_subject(db, subject_id=plan_create.subject_id, owner_id=current_user.id)
    if not subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")

    # Skús najprv načítať existujúci aktívny plán
    existing_plan = crud.get_active_study_plan_for_subject(db, subject_id=plan_create.subject_id, owner_id=current_user.id)
    if existing_plan:
        # Ak chceme zakaždým vrátiť existujúci, ak existuje
        return existing_plan 
        # Ak chceme error, ak už existuje:
        # raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Active study plan for this subject already exists.")

    # Ak neexistuje, vytvor nový
    created_plan = crud.create_study_plan_with_blocks(
        db=db,
        subject_id=plan_create.subject_id,
        owner_id=current_user.id,
        name=plan_create.name
    )
    if not created_plan: # Toto by sa nemalo stať, ak subject existuje
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create study plan")
    
    # Doplnenie subject_name do response modelu, ak to nerobí ORM automaticky
    if created_plan.subject:
        created_plan.subject_name = created_plan.subject.name
        
    return created_plan

@router.get("/subject/{subject_id}", response_model=Optional[schemas.StudyPlan]) # Môže vrátiť null, ak plán neexistuje
def get_active_study_plan_for_subject_route(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    plan = crud.get_active_study_plan_for_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if plan and plan.subject: # Doplnenie subject_name
        plan.subject_name = plan.subject.name
    return plan

@router.get("/{plan_id}", response_model=schemas.StudyPlan)
def get_study_plan_by_id_route(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    plan = crud.get_study_plan(db, study_plan_id=plan_id, owner_id=current_user.id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study plan not found")
    if plan.subject: # Doplnenie subject_name
        plan.subject_name = plan.subject.name
    return plan

@router.put("/blocks/{block_id}", response_model=schemas.StudyBlock)
def update_study_block_route(
    block_id: int,
    block_update: schemas.StudyBlockUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    updated_block = crud.update_study_block(db, study_block_id=block_id, block_update=block_update, owner_id=current_user.id)
    if not updated_block:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study block not found or not authorized to update")
    return updated_block

# Tu môžu byť ďalšie endpointy, napr. na úpravu celého plánu (PUT /study-plans/{plan_id})
# alebo na manuálne pridanie/odobratie bloku z plánu.