# backend/app/core/achievements_definitions.py
from app.db.enums import AchievementCriteriaType

ALL_ACHIEVEMENTS_DEFINITIONS = [
    {
        "name": "Prvý Predmet", "description": "Vytvoril si svoj prvý študijný predmet.", 
        "icon_name": "BookPlus", "criteria_type": AchievementCriteriaType.SUBJECTS_CREATED, "criteria_value": 1
    },
    {
        "name": "Päť Predmetov", "description": "Vytvoril si už 5 študijných predmetov! Si na dobrej ceste.", 
        "icon_name": "Library", "criteria_type": AchievementCriteriaType.SUBJECTS_CREATED, "criteria_value": 5
    },
    {
        "name": "Prvá Dokončená Téma", "description": "Úspešne si dokončil svoju prvú tému! Len tak ďalej.", 
        "icon_name": "CheckCircle", "criteria_type": AchievementCriteriaType.TOPICS_COMPLETED, "criteria_value": 1
    },
    {
        "name": "Pilný Študent", "description": "Dokončil si 10 tém. Výborne!", 
        "icon_name": "GraduationCap", "criteria_type": AchievementCriteriaType.TOPICS_COMPLETED, "criteria_value": 10
    },
    {
        "name": "Generátor Plánov", "description": "Vygeneroval si svoj prvý študijný plán. Dobrý začiatok!",
        "icon_name": "ListChecks", "criteria_type": AchievementCriteriaType.FIRST_PLAN_GENERATED, "criteria_value": 1 
    },
    {
        "name": "Organizátor", "description": "Vytvoril si predmet s aspoň 5 témami.",
        "icon_name": "Zap", "criteria_type": AchievementCriteriaType.TOPICS_CREATED_PER_SUBJECT, "criteria_value": 5
    },
    {
        "name": "Systematik", "description": "Vygeneroval alebo aktualizoval si študijný plán 5-krát.",
        "icon_name": "RefreshCcw", "criteria_type": AchievementCriteriaType.PLANS_GENERATED_OR_UPDATED, "criteria_value": 5
    },
    {
        "name": "Knižný Mol", "description": "Nahral si aspoň 3 študijné materiály k jednému predmetu.",
        "icon_name": "FileArchive", "criteria_type": AchievementCriteriaType.STUDY_MATERIALS_UPLOADED_PER_SUBJECT, "criteria_value": 3
    },
    {
        "name": "Polčas Predmetu", "description": "Dokončil si 50% tém v jednom zo svojich predmetov.",
        "icon_name": "PieChart", "criteria_type": AchievementCriteriaType.TOPICS_IN_SUBJECT_COMPLETED_PERCENT, "criteria_value": 50 
    },
    {
        "name": "Predmet Zvládnutý!", "description": "Gratulujeme! Dokončil si všetky témy v jednom predmete.",
        "icon_name": "Trophy", "criteria_type": AchievementCriteriaType.SUBJECT_FULLY_COMPLETED, "criteria_value": 1
    },
    {
        "name": "Učebný Stroj", "description": "Dokončil si celkovo 25 študijných blokov.",
        "icon_name": "Cog", "criteria_type": AchievementCriteriaType.TOTAL_STUDY_BLOCKS_COMPLETED, "criteria_value": 25
    },
    {
        "name": "Vedomostná Zásoba", "description": "Nahral si celkovo 10 študijných materiálov.",
        "icon_name": "Database", "criteria_type": AchievementCriteriaType.TOTAL_MATERIALS_UPLOADED, "criteria_value": 10
    }
    # Pridaj ďalšie podľa potreby, napr. pre CONSECUTIVE_STUDY_DAYS alebo BLOCKS_COMPLETED_ON_TIME (tie by vyžadovali zložitejšiu logiku sledovania)
]