# backend/app/db/enums.py
import enum

class TopicStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    NEEDS_REVIEW = "needs_review"

class UserDifficulty(str, enum.Enum):
    VERY_EASY = "very_easy"
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    VERY_HARD = "very_hard"

class StudyPlanStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    COMPLETED = "completed"

class StudyBlockStatus(str, enum.Enum):
    PLANNED = "planned"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    IN_PROGRESS = "in_progress"

class MaterialTypeEnum(str, enum.Enum):
    SKRIPTA = "skripta"
    PREZENTACIA = "prezentacia"
    POZNAMKY = "poznamky"
    CVICENIA = "cvicenia"
    TEST = "test"
    CLANOK = "clanok"
    KNIHA = "kniha"
    INE = "ine"

# Enum pre typy kritérií achievementov
class AchievementCriteriaType(str, enum.Enum):
    SUBJECTS_CREATED = "subjects_created"
    TOPICS_COMPLETED = "topics_completed"
    FIRST_PLAN_GENERATED = "first_plan_generated"
    TOPICS_IN_SUBJECT_COMPLETED_PERCENT = "topics_in_subject_completed_percent"
    SUBJECT_FULLY_COMPLETED = "subject_fully_completed"
    STUDY_MATERIALS_UPLOADED_PER_SUBJECT = "study_materials_uploaded_per_subject"
    # CONSECUTIVE_STUDY_DAYS = "consecutive_study_days" # Zatiaľ vynecháme, vyžaduje zložitejšie sledovanie
    TOTAL_STUDY_BLOCKS_COMPLETED = "total_study_blocks_completed"
    TOPICS_CREATED_PER_SUBJECT = "topics_created_per_subject"
    PLANS_GENERATED_OR_UPDATED = "plans_generated_or_updated"
    # BLOCKS_COMPLETED_ON_TIME = "blocks_completed_on_time" # Zatiaľ vynecháme
    TOTAL_MATERIALS_UPLOADED = "total_materials_uploaded"