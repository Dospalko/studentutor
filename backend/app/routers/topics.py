# backend/app/routers/topics.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Aktualizované importy
from ..database import get_db
from ..dependencies import get_current_active_user
from ..db import models as db_models # ORM modely
from ..schemas import topic as topic_schemas # Pydantic schémy pre témy
from ..crud import crud_topic, crud_subject # CRUD operácie

router = APIRouter(
    tags=["topics"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/subjects/{subject_id}/topics", response_model=topic_schemas.Topic, status_code=status.HTTP_201_CREATED)
def create_topic_for_subject_route(
    subject_id: int,
    topic: topic_schemas.TopicCreate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    db_subject = crud_subject.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")
    
    created_topic = crud_topic.create_topic(db=db, topic=topic, subject_id=subject_id, owner_id=current_user.id)
    return created_topic

@router.get("/subjects/{subject_id}/topics", response_model=List[topic_schemas.Topic])
def read_topics_for_subject_route(
    subject_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    db_subject = crud_subject.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject:
        # Ak predmet neexistuje, môžeme vrátiť 404 alebo prázdny zoznam.
        # Ak CRUD vracia prázdny zoznam, FastAPI to spracuje.
        # Ak chceme explicitne 404:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user for fetching topics")


    topics = crud_topic.get_topics_by_subject(db, subject_id=subject_id, owner_id=current_user.id, skip=skip, limit=limit)
    return topics

@router.get("/topics/{topic_id}", response_model=topic_schemas.Topic)
def read_topic_route(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    db_topic = crud_topic.get_topic(db, topic_id=topic_id, owner_id=current_user.id)
    if db_topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return db_topic

@router.put("/topics/{topic_id}", response_model=topic_schemas.Topic)
def update_topic_route(
    topic_id: int,
    topic_update: topic_schemas.TopicUpdate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    updated_topic = crud_topic.update_topic(db, topic_id=topic_id, topic_update=topic_update, owner_id=current_user.id)
    if updated_topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found or not authorized to update")
    return updated_topic

@router.delete("/topics/{topic_id}", response_model=topic_schemas.Topic)
def delete_topic_route(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_active_user)
):
    # CRUD funkcia delete_topic by mala vrátiť ORM objekt zmazanej témy (alebo kópiu jej dát)
    deleted_topic_orm = crud_topic.delete_topic(db, topic_id=topic_id, owner_id=current_user.id)
    if deleted_topic_orm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found or not authorized to delete")
    # FastAPI skonvertuje ORM objekt na schému topic_schemas.Topic
    return deleted_topic_orm