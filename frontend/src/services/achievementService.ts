/**
 * achievementService.ts
 *
 * Služby pre prácu s achievementami (úspechmi) používateľa.
 * Obsahuje typy a API volania na získanie všetkých definovaných achievementov a užívateľských achievementov.
 *
 * Autor: Studentutor tím
 *
 * Použitie:
 *   import { getAllDefinedAchievements, getMyAchievements } from '@/services/achievementService';
 */

import { AchievementCriteriaType } from '@/types/study';

/**
 * Základná URL adresa backend API.
 * Môže byť nastavená cez NEXT_PUBLIC_API_URL, inak defaultuje na localhost.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Typ reprezentujúci achievement (úspech), ktorý je definovaný v systéme.
 * - id: unikátne ID achievementu
 * - name: názov achievementu
 * - description: popis achievementu
 * - icon_name: voliteľný názov ikony
 * - criteria_type: typ kritéria (napr. počet blokov, tém, atď.)
 * - criteria_value: hodnota kritéria (napr. 10 blokov)
 */
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon_name?: string | null;
  criteria_type?: AchievementCriteriaType | null;
  criteria_value?: number | null;
}

/**
 * Typ reprezentujúci achievement, ktorý užívateľ získal.
 * - id: unikátne ID záznamu
 * - user_id: ID používateľa
 * - achievement_id: ID achievementu
 * - achieved_at: dátum a čas získania
 * - achievement: detailný objekt achievementu
 */
export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  achieved_at: string;
  achievement: Achievement;
}

/**
 * Získa všetky achievementy, ktoré sú v systéme definované (nie len tie, ktoré má užívateľ).
 *
 * @param token JWT token používateľa
 * @returns Promise<Achievement[]> pole všetkých definovaných achievementov
 * @throws Error ak API vráti chybu
 */
export const getAllDefinedAchievements = async (token: string): Promise<Achievement[]> => {
  const response = await fetch(`${API_BASE_URL}/achievements/all`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    let errorDetail = 'Failed to fetch defined achievements';
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorDetail;
    } catch (e) {
      console.log(e);
    }
    throw new Error(errorDetail);
  }
  return response.json();
};

/**
 * Získa všetky achievementy, ktoré užívateľ získal.
 *
 * @param token JWT token používateľa
 * @returns Promise<UserAchievement[]> pole achievementov, ktoré má užívateľ odomknuté
 * @throws Error ak API vráti chybu
 */
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
      console.log(e);
    }
    throw new Error(errorDetail);
  }
  return response.json();
};