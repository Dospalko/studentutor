# backend/app/routers/topics.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..database import get_db
from ..dependencies import get_current_active_user

router = APIRouter(
    prefix="/topics", # Tento prefix je trochu všeobecný, zváž prefix per subject napr. /subjects/{subject_id}/topics
    tags=["topics"],
    dependencies=[Depends(get_current_active_user)]
)

# Lepší prístup pre operácie s témami je cez ich predmet:
# napr. POST /subjects/{subject_id}/topics/
# Ale pre jednoduchosť teraz urobíme globálne /topics/ a subject_id bude v tele požiadavky alebo ako query parameter
# Zvolím si subject_id ako path parameter pre vytvorenie a čítanie tém pre konkrétny predmet.

@router.post("/subject/{subject_id}", response_model=schemas.Topic, status_code=status.HTTP_201_CREATED)
def create_topic_for_subject(
    subject_id: int,
    topic: schemas.TopicCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # CRUD funkcia create_topic by mala overiť, či subject_id patrí current_user
    db_topic = crud.create_topic(db=db, topic=topic, subject_id=subject_id, owner_id=current_user.id)
    if db_topic is None:
        raise HTTPException(status_code=404, detail="Subject not found or user not authorized to add topic to this subject")
    return db_topic

@router.get("/subject/{subject_id}", response_model=List[schemas.Topic])
def read_topics_for_subject(
    subject_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # CRUD funkcia by mala overiť, či subject_id patrí current_user
    topics = crud.get_topics_by_subject(db, subject_id=subject_id, owner_id=current_user.id, skip=skip, limit=limit)
    if not topics and not crud.get_subject(db, subject_id, current_user.id): # Ak žiadne témy a ani predmet neexistuje pre usera
         raise HTTPException(status_code=404, detail="Subject not found or no topics available")
    return topics

@router.get("/{topic_id}", response_model=schemas.Topic)
def read_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_topic = crud.get_topic(db, topic_id=topic_id, owner_id=current_user.id)
    if db_topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return db_topic

@router.put("/{topic_id}", response_model=schemas.Topic)
def update_topic_for_user(
    topic_id: int,
    topic_update: schemas.TopicUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    updated_topic = crud.update_topic(db, topic_id=topic_id, topic_update=topic_update, owner_id=current_user.id)
    if updated_topic is None:
        raise HTTPException(status_code=404, detail="Topic not found or not authorized to update")
    return updated_topic

@router.delete("/{topic_id}", response_model=schemas.Topic)
def delete_topic_for_user(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    deleted_topic = crud.delete_topic(db, topic_id=topic_id, owner_id=current_user.id)
    if deleted_topic is None:
        raise HTTPException(status_code=404, detail="Topic not found or not authorized to delete")
    return deleted_topic