// frontend/src/services/achievementService.ts
import { AchievementCriteriaType } from '@/types/study'; // Tento import teraz odkazuje na správny enum

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_name?: string | null;
  criteria_type?: AchievementCriteriaType | null; // Teraz bude typ správny
  criteria_value?: number | null;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  achieved_at: string; 
  achievement: Achievement; 
}

export const getAllDefinedAchievements = async (token: string): Promise<Achievement[]> => {
  const response = await fetch(`${API_BASE_URL}/achievements/all`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    // Skús spracovať chybovú odpoveď z API, ak existuje
    let errorDetail = 'Failed to fetch defined achievements';
    try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
    } catch (e) {
      console.log(e)
        // response.json() zlyhalo alebo nevrátilo detail
    }
    throw new Error(errorDetail);
  }
  return response.json();
};

export const getMyAchievements = async (token: string): Promise<UserAchievement[]> => {
  const response = await fetch(`${API_BASE_URL}/achievements/my`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    let errorDetail = 'Failed to fetch user achievements';
    try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorDetail;
    } catch (e) {
       console.log(e)
    }
    throw new Error(errorDetail);
  }
  return response.json();
};