# backend/app/core/achievements_definitions.py (príklad)
from app.db.enums import AchievementCriteriaType

ALL_ACHIEVEMENTS_DEFINITIONS = [
    {
        "name": "Prvý Predmet", "description": "Vytvoril si svoj prvý študijný predmet.", 
        "icon_name": "BookPlus", "criteria_type": AchievementCriteriaType.SUBJECTS_CREATED, "criteria_value": 1
    },
    {
        "name": "Päť Predmetov", "description": "Vytvoril si už 5 študijných predmetov!", 
        "icon_name": "Library", "criteria_type": AchievementCriteriaType.SUBJECTS_CREATED, "criteria_value": 5
    },
    {
        "name": "Prvá Dokončená Téma", "description": "Úspešne si dokončil svoju prvú tému!", 
        "icon_name": "CheckCircle", "criteria_type": AchievementCriteriaType.TOPICS_COMPLETED, "criteria_value": 1
    },
    {
        "name": "Pilný Študent", "description": "Dokončil si 10 tém.", 
        "icon_name": "GraduationCap", "criteria_type": AchievementCriteriaType.TOPICS_COMPLETED, "criteria_value": 10
    },
    {
        "name": "Generátor Plánov", "description": "Vygeneroval si svoj prvý študijný plán.",
        "icon_name": "ListChecks", "criteria_type": AchievementCriteriaType.FIRST_PLAN_GENERATED, "criteria_value": 1 # Hodnota 1 tu znamená "aspoň raz"
    },
    # ... ďalšie achievementy
]