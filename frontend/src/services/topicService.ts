// frontend/src/services/topicService.ts
import { TopicStatus, UserDifficulty } from '@/types/study'; // Alebo definuj priamo tu, ak nemáš types/study.ts

// Ak nemáš types/study.ts, môžeš ich definovať takto:
// export enum TopicStatus {
//   NOT_STARTED = "not_started",
//   IN_PROGRESS = "in_progress",
//   COMPLETED = "completed",
//   NEEDS_REVIEW = "needs_review",
// }
//
// export enum UserDifficulty {
//   VERY_EASY = "very_easy",
//   EASY = "easy",
//   MEDIUM = "medium",
//   HARD = "hard",
//   VERY_HARD = "very_hard",
// }


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Topic {
  id: number;
  name: string;
  subject_id: number;
  user_strengths?: string | null;
  user_weaknesses?: string | null;
  user_difficulty?: UserDifficulty | null;
  status: TopicStatus;
  // ai_difficulty_score?: number | null;
}

export interface TopicCreate {
  name: string;
  user_strengths?: string | null;
  user_weaknesses?: string | null;
  user_difficulty?: UserDifficulty | null;
  status?: TopicStatus;
}

export type TopicUpdate = Partial<TopicCreate>;


// Funkcia na vytvorenie novej témy pre predmet
export const createTopicForSubject = async (subjectId: number, topicData: TopicCreate, token: string): Promise<Topic> => {
  const response = await fetch(`${API_BASE_URL}/topics/subject/${subjectId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(topicData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create topic' }));
    throw new Error(errorData.detail || 'Failed to create topic');
  }
  return response.json();
};

// Funkcia na získanie všetkých tém pre predmet
export const getTopicsForSubject = async (subjectId: number, token: string): Promise<Topic[]> => {
  const response = await fetch(`${API_BASE_URL}/topics/subject/${subjectId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch topics' }));
    throw new Error(errorData.detail || 'Failed to fetch topics for subject');
  }
  return response.json();
};

// Funkcia na aktualizáciu témy
export const updateTopic = async (topicId: number, topicData: TopicUpdate, token: string): Promise<Topic> => {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(topicData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to update topic' }));
        throw new Error(errorData.detail || 'Failed to update topic');
    }
    return response.json();
};

// Funkcia na zmazanie témy
export const deleteTopic = async (topicId: number, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete topic' }));
        throw new Error(errorData.detail || 'Failed to delete topic');
    }
};

// Exportuj enumy, ak ich definuješ tu
export { TopicStatus, UserDifficulty };