# backend/app/routers/user_stats.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.db.models.user import User as UserModel
from app.db.models.study_material import StudyMaterial as SMModel
from app.dependencies import get_current_active_user

router = APIRouter(
    tags=["User Stats"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/users/me/stats")
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user),
):
    # 1) celkový počet materiálov
    total_materials = db.query(func.count(SMModel.id)) \
        .filter(SMModel.owner_id == current_user.id) \
        .scalar() or 0

    # 2) súhrny: ai_summary IS NOT NULL
    total_summaries = db.query(func.count(SMModel.id)) \
        .filter(
            SMModel.owner_id == current_user.id,
            SMModel.ai_summary.isnot(None)
        ).scalar() or 0

    # 3) tagované: ones with non-empty tags JSON array
    total_tagged = db.query(func.count(SMModel.id)) \
        .filter(
            SMModel.owner_id == current_user.id,
            SMModel.tags != None,
            SMModel.tags != "[]"
        ).scalar() or 0

    # 4) celkový počet slov v extrahovanom texte
    #    (rozdelíme extracted_text na whitespaced slová)
    all_texts = db.query(SMModel.extracted_text) \
        .filter(
            SMModel.owner_id == current_user.id,
            SMModel.extracted_text.isnot(None)
        ).all()
    total_words = sum(len(t[0].split()) for t in all_texts)

    return {
        "total_materials": total_materials,
        "total_summaries": total_summaries,
        "total_tagged": total_tagged,
        "total_words": total_words,
    }
