# backend/app/routers/topics.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.dependencies import get_current_active_user
from app.db.models.user import User as UserModel
from app.db.models.topic import Topic as TopicModel
from app.schemas import topic as topic_schema
from app.crud import crud_topic, crud_subject
from app.services.achievement_service import check_and_grant_achievements
from app.db.enums import AchievementCriteriaType, TopicStatus

router = APIRouter() 

TOPIC_OPERATIONS_PREFIX = "/topics" 
SUBJECT_TOPICS_PREFIX = "/subjects/{subject_id}/topics"

@router.post(SUBJECT_TOPICS_PREFIX + "/", response_model=topic_schema.Topic, status_code=status.HTTP_201_CREATED)
def create_topic_for_subject_route(
    subject_id: int,
    topic_payload: topic_schema.TopicCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    db_subject = crud_subject.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found or not owned by user")
    
    created_topic_orm = crud_topic.create_topic(
        db=db, topic_in=topic_payload, subject_id=subject_id, owner_id=current_user.id
    )
    if not created_topic_orm:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create topic")

    check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOPICS_CREATED_PER_SUBJECT)
    return created_topic_orm

@router.put(TOPIC_OPERATIONS_PREFIX + "/{topic_id}", response_model=topic_schema.Topic)
def update_topic_route(
    topic_id: int,
    topic_update_payload: topic_schema.TopicUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    original_topic = crud_topic.get_topic(db, topic_id=topic_id, owner_id=current_user.id)
    if not original_topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    
    original_status = original_topic.status
    updated_topic_orm = crud_topic.update_topic(
        db, topic_id=topic_id, topic_update=topic_update_payload, owner_id=current_user.id
    )
    if updated_topic_orm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic update failed")

    if updated_topic_orm.status == TopicStatus.COMPLETED and original_status != TopicStatus.COMPLETED:
        check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOPICS_COMPLETED)
        check_and_grant_achievements(db, current_user, AchievementCriteriaType.TOPICS_IN_SUBJECT_COMPLETED_PERCENT)
        check_and_grant_achievements(db, current_user, AchievementCriteriaType.SUBJECT_FULLY_COMPLETED)
    return updated_topic_orm

# --- NOVÝ ENDPOINT PRE AI ANALÝZU ---
@router.post(TOPIC_OPERATIONS_PREFIX + "/{topic_id}/analyze-ai", response_model=topic_schema.Topic)
def trigger_topic_ai_analysis_route( # Pridané _route pre odlíšenie
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    updated_topic_with_ai = crud_topic.analyze_topic_and_save_estimates(
        db, topic_id=topic_id, owner_id=current_user.id
    )
    if not updated_topic_with_ai:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found or AI analysis failed to update.")
    
    # Tu môžeš pridať achievement za použitie AI, ak taký máš
    # napr. check_and_grant_achievements(db, current_user, AchievementCriteriaType.AI_ANALYSIS_TRIGGERED)
    return updated_topic_with_ai
# ------------------------------------

# Ostatné GET a DELETE endpointy zostávajú rovnaké
@router.get(SUBJECT_TOPICS_PREFIX + "/", response_model=List[topic_schema.Topic]) # ...
def read_topics_for_subject_route(subject_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    db_subject = crud_subject.get_subject(db, subject_id=subject_id, owner_id=current_user.id)
    if not db_subject: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
    return crud_topic.get_topics_by_subject(db, subject_id=subject_id, owner_id=current_user.id, skip=skip, limit=limit)

@router.get(TOPIC_OPERATIONS_PREFIX + "/{topic_id}", response_model=topic_schema.Topic) # ...
def read_topic_route(topic_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    db_topic = crud_topic.get_topic(db, topic_id=topic_id, owner_id=current_user.id)
    if db_topic is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    return db_topic

@router.delete(TOPIC_OPERATIONS_PREFIX + "/{topic_id}", response_model=topic_schema.Topic) # ...
def delete_topic_route(topic_id: int, db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_active_user)):
    deleted_topic_orm = crud_topic.delete_topic(db, topic_id=topic_id, owner_id=current_user.id)
    if deleted_topic_orm is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    check_and_grant_achievements(db, current_user)
    return deleted_topic_orm