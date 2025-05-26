# backend/app/routers/study_plans.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional # Optional pre query parametre a response_model

from .. import crud, models, schemas # Uisti sa, že models a schemas sú správne importované
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/study-plans",
    tags=["study_plans"],
    dependencies=[Depends(get_current_active_user)] # Všetky endpointy tu budú chránené
)

@router.post("/", response_model=schemas.StudyPlan, status_code=status.HTTP_201_CREATED)
def generate_or_get_study_plan_for_subject( # Zmena názvu pre lepšiu sémantiku
    plan_create: schemas.StudyPlanCreate, # Očakáva subject_id a voliteľne name
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Generates a new study plan for the given subject if no active one exists,
    otherwise returns the existing active study plan.
    The plan will include study blocks for topics that are not yet completed.
    """
    # 1. Skontroluj, či predmet existuje a patrí používateľovi
    # CRUD funkcia get_subject by mala overiť vlastníctvo
    subject = crud.get_subject(db, subject_id=plan_create.subject_id, owner_id=current_user.id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found or not owned by user"
        )

    # 2. Skús najprv načítať existujúci aktívny plán pre tento predmet a používateľa
    # CRUD funkcia by mala správne načítať plán vrátane blokov a tém
    existing_plan = crud.get_active_study_plan_for_subject(
        db,
        subject_id=plan_create.subject_id,
        owner_id=current_user.id
    )
    
    if existing_plan:
        print(f"Router: Returning existing active plan ID {existing_plan.id} for subject ID {plan_create.subject_id}")
        # Doplnenie subject_name, ak by náhodou nebolo načítané (malo by byť vďaka get_active_study_plan_for_subject)
        if existing_plan.subject:
            existing_plan.subject_name = existing_plan.subject.name
        return existing_plan

    # 3. Ak neexistuje aktívny plán, vytvor nový
    print(f"Router: No active plan found for subject ID {plan_create.subject_id}. Creating new plan.")
    created_plan = crud.create_study_plan_with_blocks(
        db=db,
        subject_id=plan_create.subject_id,
        owner_id=current_user.id,
        name=plan_create.name  # Meno plánu je voliteľné
    )
    
    if not created_plan:
        # Toto by sa nemalo stať, ak `create_study_plan_with_blocks` je robustné
        # a `subject` existuje.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create study plan due to an unexpected error."
        )

    # Doplnenie subject_name do response modelu
    # `create_study_plan_with_blocks` by už malo vrátiť plán s načítaným subjectom (a teda menom)
    # vďaka volaniu `get_study_plan` na konci CRUD funkcie.
    if created_plan.subject:
        created_plan.subject_name = created_plan.subject.name
    else:
        # Fallback, ak by subject nebol dostupný na `created_plan` objekte
        # (čo by znamenalo problém v `create_study_plan_with_blocks` alebo `get_study_plan`)
        created_plan.subject_name = subject.name # Použi subject načítaný na začiatku

    print(f"Router: Successfully created new plan ID {created_plan.id} for subject ID {plan_create.subject_id}")
    return created_plan


@router.get("/subject/{subject_id}", response_model=Optional[schemas.StudyPlan])
def get_active_study_plan_for_subject_route(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Retrieves the active study plan for a given subject and the current user.
    Returns null if no active plan is found.
    """
    # Over, či predmet existuje a patrí používateľovi (dobrá prax, aj keď CRUD to môže tiež robiť)
    db_subject = crud.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject:
        # Ak chceme vrátiť 404, ak predmet neexistuje, namiesto len null pre plán
        # raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")
        # Alebo len necháme vrátiť null pre plán, ak predmet neexistuje
        return None


    plan = crud.get_active_study_plan_for_subject(
        db,
        subject_id=subject_id,
        owner_id=current_user.id
    )
    
    if plan:
        # `get_active_study_plan_for_subject` by mal načítať `plan.subject`
        if plan.subject:
            plan.subject_name = plan.subject.name
        else: # Fallback
            plan.subject_name = db_subject.name # Použi načítaný db_subject
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
    """
    Retrieves a specific study plan by its ID, if owned by the current user.
    """
    plan = crud.get_study_plan(db, study_plan_id=plan_id, owner_id=current_user.id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study plan with ID {plan_id} not found or not owned by user"
        )
    
    # `get_study_plan` by mal načítať `plan.subject`
    if plan.subject:
        plan.subject_name = plan.subject.name
    else: # Fallback, ak by subject nebol načítaný (menej pravdepodobné)
        db_subject_for_plan = crud.get_subject(db, subject_id=plan.subject_id, owner_id=current_user.id)
        if db_subject_for_plan:
            plan.subject_name = db_subject_for_plan.name

    print(f"Router: Returning plan ID {plan.id}")
    return plan


@router.put("/blocks/{block_id}", response_model=schemas.StudyBlock)
def update_study_block_route(
    block_id: int,
    block_update: schemas.StudyBlockUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Updates a specific study block, if it belongs to a plan owned by the current user.
    """
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

# Ďalšie možné endpointy:
# - PUT /study-plans/{plan_id} (na úpravu názvu/statusu plánu)
# - DELETE /study-plans/{plan_id} (na zmazanie celého plánu)
# - POST /study-plans/{plan_id}/blocks (na manuálne pridanie nového bloku do existujúceho plánu)
# - DELETE /study-plans/blocks/{block_id} (na zmazanie konkrétneho bloku z plánu)