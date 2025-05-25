import { TopicStatus, UserDifficulty } from '@/types/study'; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Definície typov, ktoré by mali zodpovedať Pydantic schémam z backendu
// Mali by sme ich mať zdieľané alebo presne zhodné
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

export interface Subject {
  id: number;
  name: string;
  description?: string | null;
  owner_id: number;
  topics: Topic[];
}

export interface SubjectCreate {
  name: string;
  description?: string | null;
}

export interface SubjectUpdate {
  name?: string;
  description?: string | null;
}


// Funkcia na získanie všetkých predmetov pre aktuálneho používateľa
export const getSubjects = async (token: string): Promise<Subject[]> => {
  const response = await fetch(`${API_BASE_URL}/subjects/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch subjects' }));
    throw new Error(errorData.detail || 'Failed to fetch subjects');
  }
  return response.json();
};

// Funkcia na vytvorenie nového predmetu
export const createSubject = async (subjectData: SubjectCreate, token: string): Promise<Subject> => {
  const response = await fetch(`${API_BASE_URL}/subjects/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subjectData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to create subject' }));
    throw new Error(errorData.detail || 'Failed to create subject');
  }
  return response.json();
};

// Funkcia na získanie jedného predmetu
export const getSubjectById = async (subjectId: number, token: string): Promise<Subject> => {
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch subject' }));
    throw new Error(errorData.detail || `Failed to fetch subject with ID ${subjectId}`);
  }
  return response.json();
};


// Funkcia na aktualizáciu predmetu
export const updateSubject = async (subjectId: number, subjectData: SubjectUpdate, token: string): Promise<Subject> => {
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subjectData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to update subject' }));
    throw new Error(errorData.detail || 'Failed to update subject');
  }
  return response.json();
};

// Funkcia na zmazanie predmetu
export const deleteSubject = async (subjectId: number, token: string): Promise<void> => { // Vráti void, ak backend vracia 204 alebo telo pri 200
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) { // Backend vracia 200 s telom, ak response_model je definovaný, inak by sme očakávali 204
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete subject' }));
    throw new Error(errorData.detail || 'Failed to delete subject');
  }
  // Ak backend vracia 204 (No Content), response.json() by zlyhalo.
  // Ak vracia telo (ako teraz), môžeme ho spracovať alebo ignorovať.
  // return response.json(); // Ak by sme chceli vrátiť zmazaný predmet
};