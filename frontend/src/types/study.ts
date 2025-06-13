// frontend/src/types/study.ts

export enum TopicStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  NEEDS_REVIEW = "needs_review",
}

export enum UserDifficulty {
  VERY_EASY = "very_easy",
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
  VERY_HARD = "very_hard",
}

export enum StudyPlanStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  COMPLETED = "completed",
}

export enum StudyBlockStatus {
  PLANNED = "planned",
  COMPLETED = "completed",
  SKIPPED = "skipped",
  IN_PROGRESS = "in_progress",
}

export enum MaterialTypeEnum {
  SKRIPTA = "skripta",
  PREZENTACIA = "prezentacia",
  POZNAMKY = "poznamky",
  CVICENIA = "cvicenia",
  TEST = "test",
  CLANOK = "clanok",
  KNIHA = "kniha",
  INE = "ine",
}

// ---- AKTUALIZOVANÝ ENUM ----
export enum AchievementCriteriaType {
    SUBJECTS_CREATED = "subjects_created",                     // Počet vytvorených predmetov
    TOPICS_COMPLETED = "topics_completed",                     // Celkový počet dokončených tém
    FIRST_PLAN_GENERATED = "first_plan_generated",             // Aspoň jeden plán vygenerovaný
    TOPICS_IN_SUBJECT_COMPLETED_PERCENT = "topics_in_subject_completed_percent", // Percento dokončených tém v JEDNOM predmete
    SUBJECT_FULLY_COMPLETED = "subject_fully_completed",       // Počet úplne dokončených predmetov
    STUDY_MATERIALS_UPLOADED_PER_SUBJECT = "study_materials_uploaded_per_subject", // Počet materiálov nahraných k JEDNÉMU predmetu
    TOTAL_STUDY_BLOCKS_COMPLETED = "total_study_blocks_completed", // Celkový počet dokončených študijných blokov
    TOPICS_CREATED_PER_SUBJECT = "topics_created_per_subject", // Počet tém vytvorených v jednom predmete
    PLANS_GENERATED_OR_UPDATED = "plans_generated_or_updated", // Celkový počet generovaní/aktualizácií plánov
    TOTAL_MATERIALS_UPLOADED = "total_materials_uploaded",       // Celkový počet nahraných materiálov
    // Nasledujúce sú zatiaľ na backende ako TODO, ale môžeme ich tu mať pripravené
    // BLOCKS_COMPLETED_ON_TIME = "blocks_completed_on_time",
    // CONSECUTIVE_STUDY_DAYS = "consecutive_study_days",
}