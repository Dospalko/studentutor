// frontend/src/services/achievementService.ts
import { AchievementCriteriaType } from '@/types/study'; // Pridaj tento enum aj na frontend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_name?: string | null;
  criteria_type?: AchievementCriteriaType | null;
  criteria_value?: number | null;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  achieved_at: string; // ISO string dátumu
  achievement: Achievement; // Vnorené detaily
}

export const getAllDefinedAchievements = async (token: string): Promise<Achievement[]> => {
  const response = await fetch(`${API_BASE_URL}/achievements/all`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch defined achievements');
  return response.json();
};

export const getMyAchievements = async (token: string): Promise<UserAchievement[]> => {
  const response = await fetch(`${API_BASE_URL}/achievements/my`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch user achievements');
  return response.json();
};