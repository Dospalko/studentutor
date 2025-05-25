// frontend/src/services/topicService.ts
import { TopicStatus, UserDifficulty } from '@/types/study';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Topic {
  id: number;
  name: string;
  subject_id: number;
  user_strengths?: string | null;
  user_weaknesses?: string | null;
  user_difficulty?: UserDifficulty | null; // Backend očakáva enum hodnotu alebo null
  status: TopicStatus;
}

export interface TopicCreate {
  name: string;
  user_strengths?: string; // Posielame string alebo undefined
  user_weaknesses?: string; // Posielame string alebo undefined
  user_difficulty?: UserDifficulty; // Posielame enum hodnotu alebo undefined
  status?: TopicStatus; // Posielame enum hodnotu alebo undefined (backend by mal mať default)
}

// TopicUpdate môže byť Partial<TopicCreate>, alebo špecifickejšie definovaný
export interface TopicUpdate {
  name?: string;
  user_strengths?: string | null; // Backend môže očakávať null na vymazanie
  user_weaknesses?: string | null;
  user_difficulty?: UserDifficulty | null;
  status?: TopicStatus;
}


// Funkcia na vytvorenie novej témy pre predmet
export const createTopicForSubject = async (subjectId: number, topicData: TopicCreate, token: string): Promise<Topic> => {
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/topics`, { // UPRAVENÁ CESTA
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

// Funkcia na získanie všetkých tém pre predmet (ak ju potrebuješ samostatne, inak sú témy v Subject objekte)
export const getTopicsForSubject = async (subjectId: number, token: string): Promise<Topic[]> => {
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/topics`, { // UPRAVENÁ CESTA
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
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}`, { // Cesta je OK
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
export const deleteTopic = async (topicId: number, token: string): Promise<void> => { // Ak backend vracia 200 s telom zmazanej témy, môžeš zmeniť Promise<Topic>
    const response = await fetch(`${API_BASE_URL}/topics/${topicId}`, { // Cesta je OK
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete topic' }));
        throw new Error(errorData.detail || 'Failed to delete topic');
    }
    // Ak backend vracia telo zmazanej témy: return response.json();
};

export { TopicStatus, UserDifficulty };