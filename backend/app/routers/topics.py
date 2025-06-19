from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.dependencies import get_current_active_user
from app.db.models.user import User as UserModel
from app.db.models.subject import Subject as SubjectModel
from app.schemas import topic as topic_schema
from app.crud import crud_topic, crud_subject
from app.services.achievement_service import check_and_grant_achievements
from app.db.enums import AchievementCriteriaType, TopicStatus

router = APIRouter()

# Prefixy
TOPIC_OPERATIONS_PREFIX = "/topics"
SUBJECT_TOPICS_PREFIX = "/subjects/{subject_id}/topics"


# --------------------------------------------------------------------------- #
#  CRUD ROUTES – create / update / delete / list
# --------------------------------------------------------------------------- #
@router.post(
    SUBJECT_TOPICS_PREFIX + "/",
    response_model=topic_schema.Topic,
    status_code=status.HTTP_201_CREATED,
)
def create_topic_for_subject_route(
    subject_id: int,
    topic_payload: topic_schema.TopicCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    db_subject = crud_subject.get_subject(db, subject_id, current_user.id)
    if not db_subject:
        raise HTTPException(404, detail="Subject not found or not owned by user")

    created = crud_topic.create_topic(db, topic_payload, subject_id, current_user.id)
    if not created:
        raise HTTPException(500, detail="Could not create topic")

    check_and_grant_achievements(
        db, current_user, AchievementCriteriaType.TOPICS_CREATED_PER_SUBJECT
    )
    return created


@router.put(TOPIC_OPERATIONS_PREFIX + "/{topic_id}", response_model=topic_schema.Topic)
def update_topic_route(
    topic_id: int,
    topic_update_payload: topic_schema.TopicUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    original = crud_topic.get_topic(db, topic_id, current_user.id)
    if not original:
        raise HTTPException(404, "Topic not found")

    original_status = original.status
    updated = crud_topic.update_topic(db, topic_id, topic_update_payload, current_user.id)
    if not updated:
        raise HTTPException(404, "Topic update failed")

    if (
        updated.status == TopicStatus.COMPLETED
        and original_status != TopicStatus.COMPLETED
    ):
        check_and_grant_achievements(
            db, current_user, AchievementCriteriaType.TOPICS_COMPLETED
        )
        check_and_grant_achievements(
            db, current_user, AchievementCriteriaType.TOPICS_IN_SUBJECT_COMPLETED_PERCENT
        )
        check_and_grant_achievements(
            db, current_user, AchievementCriteriaType.SUBJECT_FULLY_COMPLETED
        )
    return updated


@router.delete(TOPIC_OPERATIONS_PREFIX + "/{topic_id}", response_model=topic_schema.Topic)
def delete_topic_route(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    deleted = crud_topic.delete_topic(db, topic_id, current_user.id)
    if not deleted:
        raise HTTPException(404, "Topic not found")

    check_and_grant_achievements(db, current_user)
    return deleted


@router.get(SUBJECT_TOPICS_PREFIX + "/", response_model=list[topic_schema.Topic])
def read_topics_for_subject_route(
    subject_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    db_subject = crud_subject.get_subject(db, subject_id, current_user.id)
    if not db_subject:
        raise HTTPException(404, "Subject not found")

    return crud_topic.get_topics_by_subject(db, subject_id, current_user.id, skip, limit)


@router.get(TOPIC_OPERATIONS_PREFIX + "/{topic_id}", response_model=topic_schema.Topic)
def read_topic_route(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    db_topic = crud_topic.get_topic(db, topic_id, current_user.id)
    if not db_topic:
        raise HTTPException(404, "Topic not found")
    return db_topic


# --------------------------------------------------------------------------- #
#  NEW: Trigger AI analysis on-demand
# --------------------------------------------------------------------------- #
@router.post(TOPIC_OPERATIONS_PREFIX + "/{topic_id}/analyze-ai", response_model=topic_schema.Topic)
def trigger_topic_ai_analysis_route(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    updated = crud_topic.analyze_topic_and_save_estimates(db, topic_id, current_user.id)
    if not updated:
        raise HTTPException(404, "Topic not found or AI analysis failed")
    # (prípadný achievement za použitie AI)
    return updated
