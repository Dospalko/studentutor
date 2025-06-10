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

// ---- NOVÝ ENUM PRIDANÝ NIŽŠIE ----
export enum AchievementCriteriaType {
  SUBJECTS_CREATED = "subjects_created",
  TOPICS_COMPLETED = "topics_completed",
  TOPICS_COMPLETED_IN_SUBJECT = "topics_completed_in_subject",
  STUDY_BLOCKS_COMPLETED = "study_blocks_completed",
  LOGIN_STREAK = "login_streak",
  PERFECT_SCORE_TOPIC = "perfect_score_topic",
  FIRST_PLAN_GENERATED = "first_plan_generated",
  // Tu môžeš pridať ďalšie typy kritérií, ak ich budeš mať na backende
}