from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.dependencies import get_current_active_user
from app.db.models.user import User as UserModel
from app.schemas import achievement as achievement_schema
from app.crud import crud_achievement # Importuj nový CRUD modul

router = APIRouter(
    prefix="/achievements",
    tags=["Achievements"],
    dependencies=[Depends(get_current_active_user)]
)

@router.get("/all", response_model=List[achievement_schema.Achievement])
def read_all_defined_achievements(db: Session = Depends(get_db)):
    """
    Získa zoznam všetkých definovaných achievementov v systéme.
    """
    achievements = crud_achievement.get_all_defined_achievements(db)
    return achievements

@router.get("/my", response_model=List[achievement_schema.UserAchievement])
def read_my_achievements(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Získa zoznam achievementov, ktoré aktuálne prihlásený používateľ získal.
    """
    user_achievements = crud_achievement.get_user_achievements(db, user_id=current_user.id)
    return user_achievements # FastAPI skonvertuje List[UserAchievement ORM] na List[UserAchievement Pydantic]