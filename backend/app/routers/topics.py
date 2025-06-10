# backend/app/routers/topics.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

# Použi správne cesty k tvojim modulom
from app.database import get_db
from app.dependencies import get_current_active_user
from app.db.models.user import User as UserModel
from app.db.models.subject import Subject as SubjectModel # Ak potrebuješ overiť predmet
from app.schemas import topic as topic_schema # Alias pre schémy tém
from app.crud import crud_topic, crud_subject # Importuj relevantné CRUD moduly

router = APIRouter() # Tento router bude mať prefixy pridané v main.py alebo priamo na endpointe

# Prefix pre cesty tohto routera, ak nie je globálne nastavený pre celý modul
TOPIC_OPERATIONS_PREFIX = "/topics" 
SUBJECT_TOPICS_PREFIX = "/subjects/{subject_id}/topics"


@router.post(SUBJECT_TOPICS_PREFIX + "/", response_model=topic_schema.Topic, status_code=status.HTTP_201_CREATED)
def create_topic_for_subject_route(
    subject_id: int,
    topic_payload: topic_schema.TopicCreate, # Prijíma dáta podľa TopicCreate
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # Over, či predmet existuje a patrí používateľovi
    db_subject = crud_subject.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")
    
    # OPRAVA: Použi 'topic_in' ako názov kľúčového argumentu, ak to CRUD funkcia očakáva
    # alebo zmeň parameter 'topic' na 'topic_payload' v CRUD funkcii.
    # Tu predpokladám, že CRUD funkcia create_topic očakáva parameter 'topic_in'.
    created_topic_orm = crud_topic.create_topic(
        db=db, 
        topic_in=topic_payload, # <--- ZMENA Z 'topic' NA 'topic_in' (alebo ako sa volá v CRUD)
        subject_id=subject_id, 
        owner_id=current_user.id
    )
    if not created_topic_orm: # Ak by CRUD vrátil None (napr. pri nejakej internej chybe)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create topic")
    return created_topic_orm

@router.get(SUBJECT_TOPICS_PREFIX + "/", response_model=List[topic_schema.Topic])
def read_topics_for_subject_route(
    subject_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    db_subject = crud_subject.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")
    topics = crud_topic.get_topics_by_subject(db, subject_id=subject_id, owner_id=current_user.id, skip=skip, limit=limit)
    return topics

@router.get(TOPIC_OPERATIONS_PREFIX + "/{topic_id}", response_model=topic_schema.Topic)
def read_topic_route(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    db_topic = crud_topic.get_topic(db, topic_id=topic_id, owner_id=current_user.id)
    if db_topic is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return db_topic

@router.put(TOPIC_OPERATIONS_PREFIX + "/{topic_id}", response_model=topic_schema.Topic)
def update_topic_route(
    topic_id: int,
    topic_update_payload: topic_schema.TopicUpdate, # Prijíma dáta podľa TopicUpdate
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    # Opäť, uisti sa, že názov kľúčového argumentu zodpovedá definícii v CRUD
    updated_topic_orm = crud_topic.update_topic(
        db, 
        topic_id=topic_id, 
        topic_update=topic_update_payload, # Predpokladáme, že CRUD očakáva 'topic_update'
        owner_id=current_user.id
    )
    if updated_topic_orm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found or not authorized to update")
    return updated_topic_orm

@router.delete(TOPIC_OPERATIONS_PREFIX + "/{topic_id}", response_model=topic_schema.Topic)
def delete_topic_route(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    deleted_topic_orm = crud_topic.delete_topic(db, topic_id=topic_id, owner_id=current_user.id)
    if deleted_topic_orm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found or not authorized to delete")
    return deleted_topic_orm