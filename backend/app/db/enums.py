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


class AchievementCriteriaType(str, enum.Enum):
    SUBJECTS_CREATED = "subjects_created" # Počet vytvorených predmetov
    TOPICS_COMPLETED = "topics_completed" # Počet dokončených tém celkovo
    TOPICS_COMPLETED_IN_SUBJECT = "topics_completed_in_subject" # Počet dokončených tém v jednom predmete
    STUDY_BLOCKS_COMPLETED = "study_blocks_completed" # Počet dokončených študijných blokov
    LOGIN_STREAK = "login_streak" # Koľko dní po sebe sa prihlásil (pokročilejšie)
    PERFECT_SCORE_TOPIC = "perfect_score_topic" # Ak by si mal testovanie
    FIRST_PLAN_GENERATED = "first_plan_generated"