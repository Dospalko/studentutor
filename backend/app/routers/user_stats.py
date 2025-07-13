# backend/app/routers/user_stats.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.db.models.user import User as UserModel
from app.db.models import (
    Subject as SubjectModel,
    Topic as TopicModel,
    StudyBlock as BlockModel,
    Achievement as AchModel,
    StudyMaterial as SMModel,
)
from app.dependencies import get_current_active_user

router = APIRouter(tags=["User Stats"], dependencies=[Depends(get_current_active_user)])

@router.get("/users/me/stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    uid = current_user.id

    # materiály
    total_materials = db.query(func.count(SMModel.id)).filter(SMModel.owner_id == uid).scalar() or 0
    total_summaries = db.query(func.count(SMModel.id))\
        .filter(SMModel.owner_id == uid, SMModel.ai_summary.isnot(None)).scalar() or 0
    total_tagged = db.query(func.count(SMModel.id))\
        .filter(SMModel.owner_id == uid, SMModel.tags != None, SMModel.tags != "[]").scalar() or 0
    texts = db.query(SMModel.extracted_text).filter(SMModel.owner_id == uid, SMModel.extracted_text.isnot(None)).all()
    total_words = sum(len(txt[0].split()) for txt in texts)

    # predmety + témy
    total_subjects = db.query(func.count(SubjectModel.id)).filter(SubjectModel.owner_id == uid).scalar() or 0
    total_topics = db.query(func.count(TopicModel.id)).filter(TopicModel.owner_id == uid).scalar() or 0
    total_done_topics = db.query(func.count(TopicModel.id))\
        .filter(TopicModel.owner_id == uid, TopicModel.status == "COMPLETED").scalar() or 0

    # študijné bloky
    total_blocks = db.query(func.count(BlockModel.id)).filter(BlockModel.owner_id == uid).scalar() or 0
    done_blocks  = db.query(func.count(BlockModel.id))\
        .filter(BlockModel.owner_id == uid, BlockModel.status == "COMPLETED").scalar() or 0
    skipped_blocks = db.query(func.count(BlockModel.id))\
        .filter(BlockModel.owner_id == uid, BlockModel.status == "SKIPPED").scalar() or 0
    total_minutes = db.query(func.coalesce(func.sum(BlockModel.duration_minutes), 0))\
        .filter(BlockModel.owner_id == uid).scalar() or 0

    # achievementy
    total_achievements = db.query(func.count(AchModel.id))\
        .filter(AchModel.user_id == uid, AchModel.is_unlocked == True).scalar() or 0

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
            "topics_completed": total_done_topics,
        },
        "study_blocks": {
            "total": total_blocks,
            "completed": done_blocks,
            "skipped": skipped_blocks,
            "minutes_scheduled": total_minutes,
        },
        "achievements_unlocked": total_achievements,
    }

