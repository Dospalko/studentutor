import { TopicStatus, UserDifficulty } from '@/types/study';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ---------------------------------------------------------------------------
// Typy
// ---------------------------------------------------------------------------
export interface Topic {
  id: number;
  name: string;
  subject_id: number;
  user_strengths?: string | null;
  user_weaknesses?: string | null;
  user_difficulty?: UserDifficulty | null;
  status: TopicStatus;

  ai_difficulty_score?: number | null;
  ai_estimated_duration?: number | null;
}

export interface TopicCreate {
  name: string;
  user_strengths?: string;
  user_weaknesses?: string;
  user_difficulty?: UserDifficulty;
  status?: TopicStatus;
}

export interface TopicUpdate {
  name?: string;
  user_strengths?: string | null;
  user_weaknesses?: string | null;
  user_difficulty?: UserDifficulty | null;
  status?: TopicStatus;
}

// ---------------------------------------------------------------------------
// CRUD volania
// ---------------------------------------------------------------------------
export const createTopicForSubject = async (
  subjectId: number,
  topic: TopicCreate,
  token: string
): Promise<Topic> => {
  const res = await fetch(`${API_BASE_URL}/subjects/${subjectId}/topics`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(topic),
  });
  if (!res.ok) throw new Error((await res.json()).detail);
  return res.json();
};

export const getTopicsForSubject = async (
  subjectId: number,
  token: string
): Promise<Topic[]> => {
  const res = await fetch(`${API_BASE_URL}/subjects/${subjectId}/topics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).detail);
  return res.json();
};

export const updateTopic = async (
  topicId: number,
  data: TopicUpdate,
  token: string
): Promise<Topic> => {
  const res = await fetch(`${API_BASE_URL}/topics/${topicId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).detail);
  return res.json();
};

export const deleteTopic = async (topicId: number, token: string): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/topics/${topicId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).detail);
};

// ---------------------------------------------------------------------------
// NEW: spusti AI analýzu manuálne
// ---------------------------------------------------------------------------
export const analyzeTopicNow = async (topicId: number, token: string): Promise<Topic> => {
  const res = await fetch(`${API_BASE_URL}/topics/${topicId}/analyze-ai`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error((await res.json()).detail);
  return res.json();
};

export { TopicStatus, UserDifficulty };
