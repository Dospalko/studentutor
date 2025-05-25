# backend/app/routers/topics.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    tags=["topics"],
    dependencies=[Depends(get_current_active_user)]
)

# End pointy pre témy v kontexte predmetu
@router.post("/subjects/{subject_id}/topics", response_model=schemas.Topic, status_code=status.HTTP_201_CREATED)
def create_topic_for_subject_route( # Zmenený názov funkcie pre jednoznačnosť
    subject_id: int,
    topic: schemas.TopicCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Over, či predmet existuje a patrí používateľovi
    db_subject = crud.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")
    
    created_topic = crud.create_topic(db=db, topic=topic, subject_id=subject_id, owner_id=current_user.id)
    # crud.create_topic by mal vrátiť None, ak subject nepatrí userovi, ale už sme to overili
    return created_topic

@router.get("/subjects/{subject_id}/topics", response_model=List[schemas.Topic])
def read_topics_for_subject_route( # Zmenený názov funkcie
    subject_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Over, či predmet existuje a patrí používateľovi
    db_subject = crud.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")

    topics = crud.get_topics_by_subject(db, subject_id=subject_id, owner_id=current_user.id, skip=skip, limit=limit)
    return topics

# End pointy pre konkrétnu tému podľa jej ID
@router.get("/topics/{topic_id}", response_model=schemas.Topic)
def read_topic_route( # Zmenený názov funkcie
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_topic = crud.get_topic(db, topic_id=topic_id, owner_id=current_user.id)
    if db_topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return db_topic

@router.put("/topics/{topic_id}", response_model=schemas.Topic)
def update_topic_route( # Zmenený názov funkcie
    topic_id: int,
    topic_update: schemas.TopicUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    updated_topic = crud.update_topic(db, topic_id=topic_id, topic_update=topic_update, owner_id=current_user.id)
    if updated_topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found or not authorized to update")
    return updated_topic

@router.delete("/topics/{topic_id}", response_model=schemas.Topic) # FastAPI vráti 200 OK s telom
def delete_topic_route( # Zmenený názov funkcie
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    deleted_topic = crud.delete_topic(db, topic_id=topic_id, owner_id=current_user.id)
    if deleted_topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found or not authorized to delete")
    return deleted_topic