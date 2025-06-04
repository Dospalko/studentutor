# backend/app/routers/study_materials.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path

from app import crud # Importuj celý modul crud
# Použi presnejšie cesty pre modely a schémy
from app.db.models.user import User as UserModel 
from app.db.enums import MaterialTypeEnum
from app.schemas import study_material as sm_schema # Alias pre schémy materiálov
from app import file_utils # Náš modul pre súbory
from app.database import get_db
from app.dependencies import get_current_active_user


router = APIRouter(
    # Prefix pre materiály spojené s predmetom
    prefix="/subjects/{subject_id}/materials", 
    tags=["Study Materials (per Subject)"],
    dependencies=[Depends(get_current_active_user)]
)

# Samostatný router pre operácie s materiálom podľa jeho ID (napr. download, update, delete)
material_router = APIRouter(
    prefix="/materials",
    tags=["Study Materials (general)"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=sm_schema.StudyMaterial, status_code=status.HTTP_201_CREATED)
async def upload_material_to_subject( # Zmenený názov pre lepšiu čitateľnosť
    subject_id: int, # Získané z prefixu routera
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    material_type: Optional[MaterialTypeEnum] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    material_meta = sm_schema.StudyMaterialCreate(
        title=title, description=description, material_type=material_type
    )
    db_material = crud.create_study_material(
        db=db, material_meta=material_meta, upload_file=file,
        subject_id=subject_id, owner_id=current_user.id
    )
    if not db_material:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to upload material. Subject not found, file might already exist, or save failed.")
    return db_material

@router.get("/", response_model=List[sm_schema.StudyMaterial])
def get_materials_for_subject( # Zmenený názov
    subject_id: int, # Získané z prefixu routera
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # CRUD funkcia by mala overiť, či používateľ vlastní predmet s daným subject_id
    materials = crud.get_study_materials_for_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if materials is None: # Ak by CRUD vracal None pri neexistujúcom predmete
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")
    return materials

# Operácie s konkrétnym materiálom cez material_router
@material_router.get("/{material_id}", response_model=sm_schema.StudyMaterial)
def get_material_details( # Zmenený názov
    material_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    material = crud.get_study_material(db, material_id=material_id, owner_id=current_user.id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found")
    return material

@material_router.get("/{material_id}/download")
async def download_material( # Zmenený názov
    material_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    material = crud.get_study_material(db, material_id=material_id, owner_id=current_user.id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found or not authorized")

    file_on_disk = file_utils.MEDIA_ROOT / Path(material.file_path)
    if not file_on_disk.exists() or not file_on_disk.is_file():
        # Log this error on the server
        print(f"Error: File not found on disk for material ID {material_id} at path {file_on_disk}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found on server")

    return FileResponse(
        path=str(file_on_disk),
        filename=material.file_name, # Použije pôvodný názov súboru
        media_type=material.file_type or 'application/octet-stream' # Fallback media type
    )

@material_router.put("/{material_id}", response_model=sm_schema.StudyMaterial)
def update_material_metadata( # Zmenený názov
    material_id: int,
    material_update: sm_schema.StudyMaterialUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    updated_material = crud.update_study_material(
        db, material_id=material_id, material_update=material_update, owner_id=current_user.id
    )
    if not updated_material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found or update failed")
    return updated_material

@material_router.delete("/{material_id}", response_model=sm_schema.StudyMaterial) # Alebo len status 204 bez response_model
def delete_material( # Zmenený názov
    material_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    deleted_material = crud.delete_study_material(db, material_id=material_id, owner_id=current_user.id)
    if not deleted_material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material not found or delete failed")
    return deleted_material