# backend/app/routers/user_stats.py
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_active_user
from app.db.models.user import User as UserModel
from app.db.models import (
    Subject         as SubjectModel,
    Topic           as TopicModel,
    StudyBlock      as BlockModel,
    StudyMaterial   as SMModel,
    UserAchievement as UA_Model,
)

router = APIRouter(
    tags=["User Stats"],
    dependencies=[Depends(get_current_active_user)],
)


@router.get("/users/me/stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    uid = current_user.id

    # 1) Študijné materiály
    total_materials = (
        db.query(func.count(SMModel.id))
        .filter(SMModel.owner_id == uid)
        .scalar()
        or 0
    )
    total_summaries = (
        db.query(func.count(SMModel.id))
        .filter(SMModel.owner_id == uid, SMModel.ai_summary.isnot(None))
        .scalar()
        or 0
    )
    total_tagged = (
        db.query(func.count(SMModel.id))
        .filter(
            SMModel.owner_id == uid,
            SMModel.tags.isnot(None),
            SMModel.tags != "[]",
        )
        .scalar()
        or 0
    )
    texts = (
        db.query(SMModel.extracted_text)
        .filter(SMModel.owner_id == uid, SMModel.extracted_text.isnot(None))
        .all()
    )
    total_words = sum(len(t[0].split()) for t in texts)

    # 2) Predmety a témy
    total_subjects = (
        db.query(func.count(SubjectModel.id))
        .filter(SubjectModel.owner_id == uid)
        .scalar()
        or 0
    )
    total_topics = (
        db.query(func.count(TopicModel.id))
        .join(SubjectModel, TopicModel.subject_id == SubjectModel.id)
        .filter(SubjectModel.owner_id == uid)
        .scalar()
        or 0
    )
    topics_completed = (
        db.query(func.count(TopicModel.id))
        .join(SubjectModel, TopicModel.subject_id == SubjectModel.id)
        .filter(SubjectModel.owner_id == uid, TopicModel.status == "COMPLETED")
        .scalar()
        or 0
    )

    # 3) Študijné bloky
    blocks_q = (
        db.query(BlockModel)
        .join(TopicModel, BlockModel.topic_id == TopicModel.id)
        .join(SubjectModel, TopicModel.subject_id == SubjectModel.id)
        .filter(SubjectModel.owner_id == uid)
    )
    total_blocks = blocks_q.count()
    done_blocks = blocks_q.filter(BlockModel.status == "COMPLETED").count()
    skipped_blocks = blocks_q.filter(BlockModel.status == "SKIPPED").count()
    total_minutes = (
        db.query(func.coalesce(func.sum(BlockModel.duration_minutes), 0))
        .join(TopicModel, BlockModel.topic_id == TopicModel.id)
        .join(SubjectModel, TopicModel.subject_id == SubjectModel.id)
        .filter(SubjectModel.owner_id == uid)
        .scalar()
        or 0
    )

    # 4) Achievementy (počet odomknutí)
    achievements_unlocked = (
        db.query(func.count(UA_Model.id)).filter(UA_Model.user_id == uid).scalar() or 0
    )

    return {
        "materials": {
            "total": total_materials,
            "summaries": total_summaries,
            "tagged": total_tagged,
            "words_extracted": total_words,
        },
        "subjects": {
            "total": total_subjects,
            "topics": total_topics,
            "topics_completed": topics_completed,
        },
        "study_blocks": {
            "total": total_blocks,
            "completed": done_blocks,
            "skipped": skipped_blocks,
            "minutes": total_minutes,
        },
        "achievements_unlocked": achievements_unlocked,
    }
