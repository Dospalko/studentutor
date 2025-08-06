
/**
 * studyMaterialService.ts
 *
 * Service functions for managing study materials in Studentutor frontend.
 * Provides CRUD operations, file download helpers, AI summary/tag generation, and user stats.
 *
 * Usage:
 *   import { uploadStudyMaterial, getStudyMaterialsForSubject, ... } from '@/services/studyMaterialService';
 */

import { MaterialTypeEnum } from "@/types/study";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ---------------- Types & Interfaces ------------------------------------- */
/**
 * StudyMaterial represents a single uploaded study material (e.g. PDF, notes).
 * - id: unique identifier
 * - file_name: original file name
 * - file_type: MIME type (optional)
 * - file_size: size in bytes (optional)
 * - uploaded_at: ISO string of upload date
 * - title: user-defined title (optional)
 * - description: user-defined description (optional)
 * - material_type: type/category (optional)
 * - subject_id: related subject
 * - owner_id: uploader's user id
 * - extracted_text: extracted text (optional)
 * - tags: array of tags (optional)
 * - summary: AI-generated summary (optional)
 */
export interface StudyMaterial {
  id: number;
  file_name: string;
  file_type?: string | null;
  file_size?: number | null;
  uploaded_at: string;
  title?: string | null;
  description?: string | null;
  material_type?: MaterialTypeEnum | null;
  subject_id: number;
  owner_id: number;
  extracted_text?: string | null;
  tags?: string[];
  summary?: string | null;
}

/**
 * StudyMaterialMetadata is used for uploading or updating material meta info.
 */
export interface StudyMaterialMetadata {
  title?: string | null;
  description?: string | null;
  material_type?: MaterialTypeEnum | null;
}

/**
 * MaterialSummaryResponse represents the response from AI summary endpoint.
 */
export interface MaterialSummaryResponse {
  material_id: number;
  file_name: string;
  summary: string | null;
  ai_error: string | null;
  word_count?: number | null;
}

/**
 * UserStats represents statistics for the current user (materials, subjects, blocks, achievements).
 */
export interface UserStats {
  materials: {
    total: number;
    summaries: number;
    tagged: number;
    words_extracted: number;
  };
  subjects: {
    total: number;
    topics: number;
    topics_completed: number;
  };
  study_blocks: {
    total: number;
    completed: number;
    skipped: number;
    minutes_scheduled: number;
  };
  achievements_unlocked: number;
}

/* ---------------- Helper ------------------------------------------------- */
/**
 * Helper for authenticated JSON fetch requests.
 * Throws error if response is not ok.
 * @param url API endpoint (relative)
 * @param token JWT token
 * @param init Optional fetch options
 */
async function fetchJson<T>(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const mergedHeaders: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(API_BASE_URL + url, {
    ...init,
    headers: mergedHeaders,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/* ---------------- CRUD: upload / list / delete -------------------------- */
/**
 * Upload a new study material file for a subject.
 * @param subjectId Subject ID
 * @param file File to upload
 * @param meta Metadata (title, description, type)
 * @param token JWT token
 * @returns Promise<StudyMaterial> newly created material
 */
export const uploadStudyMaterial = async (
  subjectId: number,
  file: File,
  meta: StudyMaterialMetadata,
  token: string
): Promise<StudyMaterial> => {
  const fd = new FormData();
  fd.append("file", file);
  if (meta.title) fd.append("title", meta.title.trim());
  if (meta.description) fd.append("description", meta.description.trim());
  if (meta.material_type) fd.append("material_type", meta.material_type);

  return fetchJson<StudyMaterial>(`/subjects/${subjectId}/materials/`, token, {
    method: "POST",
    body: fd,
  });
};

/**
 * Get all study materials for a subject (optionally filtered by tags).
 * @param subjectId Subject ID
 * @param token JWT token
 * @param tags Optional array of tags to filter
 * @returns Promise<StudyMaterial[]>
 */
export const getStudyMaterialsForSubject = (
  subjectId: number,
  token: string,
  tags?: string[]
) => {
  const query =
    tags && tags.length > 0
      ? `?tags=${tags.map(t => encodeURIComponent(`#${t}`)).join(",")}`
      : "";
  return fetchJson<StudyMaterial[]>(
    `/subjects/${subjectId}/materials/${query}`,
    token
  );
};

/**
 * Delete a study material by ID.
 * @param id Material ID
 * @param token JWT token
 * @returns Promise<StudyMaterial> deleted material
 */
export const deleteStudyMaterial = (id: number, token: string) =>
  fetchJson<StudyMaterial>(`/materials/${id}`, token, { method: "DELETE" });

/* ---------------- Download helpers -------------------------------------- */
/**
 * Download a protected file as a blob URL (for preview/download).
 * @param id Material ID
 * @param token JWT token
 * @returns Promise<{ blobUrl, fileType }>
 */
export const fetchProtectedFileAsBlobUrl = async (
  id: number,
  token: string
): Promise<{ blobUrl: string; fileType: string | null }> => {
  const res = await fetch(API_BASE_URL + `/materials/${id}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  return {
    blobUrl: URL.createObjectURL(blob),
    fileType: res.headers.get("content-type"),
  };
};

/**
 * Download a protected file and trigger browser download.
 * @param id Material ID
 * @param filename Filename to save as
 * @param token JWT token
 */
export const downloadProtectedFile = async (
  id: number,
  filename: string,
  token: string
) => {
  const { blobUrl } = await fetchProtectedFileAsBlobUrl(id, token);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
};

/* ---------------- AI – summary ------------------------------------------ */
/**
 * Fetch AI-generated summary for a material (if exists).
 * @param id Material ID
 * @param token JWT token
 * @returns Promise<MaterialSummaryResponse>
 */
export const fetchMaterialSummary = (
  id: number,
  token: string
) => fetchJson<MaterialSummaryResponse>(`/materials/${id}/summary`, token);

/**
 * Force-generate a new AI summary for a material.
 * @param id Material ID
 * @param token JWT token
 * @returns Promise<MaterialSummaryResponse>
 */
export const generateMaterialSummary = (
  id: number,
  token: string
) =>
  fetchJson<MaterialSummaryResponse>(
    `/materials/${id}/summary?force=true`,
    token
  );

/* ---------------- AI – tags --------------------------------------------- */
/**
 * Fetch tags for a material (AI or user-generated).
 * @param id Material ID
 * @param token JWT token
 * @returns Promise<string[]>
 */
export const fetchMaterialTags = (id: number, token: string) =>
  fetchJson<string[]>(`/materials/${id}/tags`, token);

/**
 * Force-generate new AI tags for a material.
 * @param id Material ID
 * @param token JWT token
 * @returns Promise<string[]>
 */
export const generateMaterialTags = (id: number, token: string) =>
  fetchJson<string[]>(
    `/materials/${id}/generate-tags?force=true`,
    token,
    { method: "POST" }
  );

/* ---------------- Patch material ---------------------------------------- */
/**
 * Payload for patching a material (tags, summary, ...).
 */
export interface PatchMaterialPayload {
  tags?: string[];
  ai_summary?: string;
}

/**
 * Patch a material (update tags, summary, etc).
 * @param id Material ID
 * @param payload PatchMaterialPayload
 * @param token JWT token
 * @returns Promise<StudyMaterial>
 */
export const patchMaterial = (
  id: number,
  payload: PatchMaterialPayload,
  token: string
): Promise<StudyMaterial> =>
  fetchJson<StudyMaterial>(
    `/materials/${id}`,
    token,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

/* ---------------- User stats -------------------------------------------- */

/**
 * Fetch statistics for the current user (materials, subjects, blocks, achievements).
 * @param token JWT token
 * @returns Promise<UserStats>
 */
export const fetchUserStats = (token: string): Promise<UserStats> =>
  fetchJson<UserStats>("/users/me/stats", token);
