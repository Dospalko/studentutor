/* -------------------------------------------------------------------------- */
/*                                Study Plans                                 */
/* -------------------------------------------------------------------------- */

import { Topic } from "./topicService"
import { StudyPlanStatus, StudyBlockStatus } from "@/types/study"

/* API base – fallback na localhost pri vývoji */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/* -------------------------------------------------------------------------- */
/*                                  Typy                                      */
/* -------------------------------------------------------------------------- */

export interface StudyBlock {
  id: number
  scheduled_at?: string | null
  duration_minutes?: number | null
  status: StudyBlockStatus
  notes?: string | null               // ← AI môže doplniť odporúčanie / poznámku
  study_plan_id: number
  topic_id: number
  topic: Topic
  material_id?: number | null         // voliteľne väzba na študijný materiál
  subject_id: number
}

export interface StudyPlan {
  id: number
  name?: string | null
  created_at: string
  status: StudyPlanStatus
  user_id: number
  subject_id: number
  subject_name?: string | null
  study_blocks: StudyBlock[]
}

export interface StudyPlanCreate {
  subject_id: number
  name?: string | null
}

export interface StudyBlockUpdate {
  scheduled_at?: string | null
  duration_minutes?: number | null
  status?: StudyBlockStatus
  notes?: string | null
  material_id?: number | null
}

/**
 * Voľby pre generovanie/plánovanie
 *  - forceRegenerate: ignoruje existujúci aktívny plán a vynúti nový
 *  - useAi:          ak false → záložný „pravidelný“ plánovač (bez AI)
 */
export interface GeneratePlanOptions {
  forceRegenerate?: boolean
  useAi?: boolean
}

/* -------------------------------------------------------------------------- */
/*                             API volania                                    */
/* -------------------------------------------------------------------------- */

/**
 * Vytvorí alebo vráti existujúci aktívny plán pre daný predmet.
 * Pozn.: backend akceptuje GET parametre:
 *   • force_regenerate=true
 *   • use_ai=false
 */
export const generateOrGetStudyPlan = async (
  planData: StudyPlanCreate,
  token: string,
  options?: GeneratePlanOptions
): Promise<StudyPlan> => {
  /*   zostavujeme URL s voliteľnými query parametrami   */
  const query = new URLSearchParams()
  if (options?.forceRegenerate) query.append("force_regenerate", "true")
  if (options?.useAi === false) query.append("use_ai", "false")

  const url =
    `${API_BASE_URL}/study-plans/` + (query.size ? `?${query.toString()}` : "")

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(planData),
  })

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: "Failed to generate or get study plan" }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * Získa aktívny plán pre predmet (alebo null ak neexistuje).
 */
export const getActiveStudyPlanForSubject = async (
  subjectId: number,
  token: string
): Promise<StudyPlan | null> => {
  const res = await fetch(
    `${API_BASE_URL}/study-plans/subject/${subjectId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  )

  if (res.status === 404) return null
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: "Failed to fetch study plan" }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  const text = await res.text()
  return text ? (JSON.parse(text) as StudyPlan) : null
}

/**
 * Aktualizuje študijný blok (napr. označí ho ako dokončený, presunie čas atď.)
 */
export const updateStudyBlock = async (
  blockId: number,
  blockData: StudyBlockUpdate,
  token: string
): Promise<StudyBlock> => {
  const res = await fetch(`${API_BASE_URL}/study-plans/blocks/${blockId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(blockData),
  })

  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: "Failed to update study block" }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}
