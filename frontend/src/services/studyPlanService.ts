// frontend/src/services/studyPlanService.ts
import { Topic } from './topicService'; // Alebo priamo z types
import { StudyPlanStatus, StudyBlockStatus } from '@/types/study'; // Predpokladáme, že enumy pridáš/máš v types/study.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// --- Typy pre StudyPlan a StudyBlock (mali by zodpovedať backend schémam) ---
export interface StudyBlock {
  id: number;
  scheduled_at?: string | null; // Dátum ako string z API
  duration_minutes?: number | null;
  status: StudyBlockStatus;
  notes?: string | null;
  study_plan_id: number;
  topic_id: number;
  topic: Topic; // Detail témy
}

export interface StudyPlan {
  id: number;
  name?: string | null;
  created_at: string; // Dátum ako string z API
  status: StudyPlanStatus;
  user_id: number;
  subject_id: number;
  subject_name?: string | null;
  study_blocks: StudyBlock[];
}

export interface StudyPlanCreate {
  subject_id: number;
  name?: string | null;
}

export interface StudyBlockUpdate {
  scheduled_at?: string | null; // Dátum ako string
  duration_minutes?: number | null;
  status?: StudyBlockStatus;
  notes?: string | null;
}


// Funkcia na vygenerovanie/získanie študijného plánu pre predmet
export const generateOrGetStudyPlan = async (planData: StudyPlanCreate, token: string): Promise<StudyPlan> => {
  const response = await fetch(`${API_BASE_URL}/study-plans/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(planData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to generate or get study plan' }));
    throw new Error(errorData.detail || 'Failed to generate or get study plan');
  }
  return response.json();
};

// Funkcia na načítanie aktívneho študijného plánu pre predmet
export const getActiveStudyPlanForSubject = async (subjectId: number, token: string): Promise<StudyPlan | null> => {
  const response = await fetch(`${API_BASE_URL}/study-plans/subject/${subjectId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    if (response.status === 404) return null; // Ak plán neexistuje, backend môže vrátiť 404
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch study plan' }));
    throw new Error(errorData.detail || 'Failed to fetch study plan');
  }
  // Ak backend vráti prázdne telo pre 200 OK ak plán neexistuje (čo by nemal pri Optional[Schema] response_model),
  // potom treba ošetriť aj to. Predpokladáme, že buď vráti plán alebo 404.
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};


// Funkcia na aktualizáciu študijného bloku
export const updateStudyBlock = async (blockId: number, blockData: StudyBlockUpdate, token: string): Promise<StudyBlock> => {
  const response = await fetch(`${API_BASE_URL}/study-plans/blocks/${blockId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(blockData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to update study block' }));
    throw new Error(errorData.detail || 'Failed to update study block');
  }
  return response.json();
};