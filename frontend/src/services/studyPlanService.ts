// frontend/src/services/studyPlanService.ts
import { Topic } from './topicService';
import { StudyPlanStatus, StudyBlockStatus } from '@/types/study';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// --- Typy (zostávajú rovnaké alebo upravené podľa backendu) ---
export interface StudyBlock {
  id: number;
  scheduled_at?: string | null;
  duration_minutes?: number | null;
  status: StudyBlockStatus;
  notes?: string | null;
  study_plan_id: number;
  topic_id: number;
  topic: Topic;
}

export interface StudyPlan {
  id: number;
  name?: string | null;
  created_at: string;
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
  scheduled_at?: string | null;
  duration_minutes?: number | null;
  status?: StudyBlockStatus;
  notes?: string | null;
}

export interface GeneratePlanOptions { // ZMENA na camelCase
    forceRegenerate?: boolean;
  }
  
  export const generateOrGetStudyPlan = async (
    planData: StudyPlanCreate,
    token: string,
    options?: GeneratePlanOptions
  ): Promise<StudyPlan> => {
    let apiUrl = `${API_BASE_URL}/study-plans/`;
    
    const queryParams = new URLSearchParams();
    // Konverzia na snake_case pre API query parameter, ak je to potrebné
    if (options?.forceRegenerate) { // Použi camelCase z options
      queryParams.append('force_regenerate', 'true'); // API očakáva snake_case
    }
    
    if (queryParams.toString()) {
        apiUrl += `?${queryParams.toString()}`;
    }
  
    const response = await fetch(apiUrl, {
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
    if (response.status === 404) return null;
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch study plan' }));
    throw new Error(errorData.detail || 'Failed to fetch study plan');
  }
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