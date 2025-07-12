// frontend/src/services/studyMaterialService.ts
import { MaterialTypeEnum } from "@/types/study";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ---------------- Typy -------------------------------------------------- */
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
  summary?: string | null
}

export interface StudyMaterialMetadata {
  title?: string | null;
  description?: string | null;
  material_type?: MaterialTypeEnum | null;
}

export interface MaterialSummaryResponse {
  material_id: number;
  file_name: string;
  summary: string | null;
  ai_error: string | null;
  word_count?: number | null;
}

/* ---------------- Helper -a----------------------------------------------- */
async function fetchJson<T>(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  /* 🔧  MERGE – zachováme hlavičky z init.headers */
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

/* ---------------- CRUD upload / list / delete -------------------------- */
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

export const getStudyMaterialsForSubject = (
  subjectId: number,
  token: string,
  tags?: string[]           //  <-- NOVÉ
) => {
  const query =
    tags && tags.length > 0
      ? `?tags=${tags.map(t => encodeURIComponent(`#${t}`)).join(",")}`
      : ""
  return fetchJson<StudyMaterial[]>(
    `/subjects/${subjectId}/materials/${query}`,
    token
  )
}


export const deleteStudyMaterial = (id: number, token: string) =>
  fetchJson<StudyMaterial>(`/materials/${id}`, token, { method: "DELETE" });

/* ---------------- Download helpers ------------------------------------- */
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

/* ---------------- AI – summary ----------------------------------------- */
export const fetchMaterialSummary = (
  id: number,
  token: string
) => fetchJson<MaterialSummaryResponse>(`/materials/${id}/summary`, token);

export const generateMaterialSummary = (
  id: number,
  token: string
) =>
  fetchJson<MaterialSummaryResponse>(
    `/materials/${id}/summary?force=true`,
    token
  );

/* ---------------- AI – tags -------------------------------------------- */
export const fetchMaterialTags = (id: number, token: string) =>
  fetchJson<string[]>(`/materials/${id}/tags`, token);

export const generateMaterialTags = (id: number, token: string) =>
  fetchJson<string[]>(
    `/materials/${id}/generate-tags?force=true`,
    token,
    { method: "POST" }
  );

  


  export interface PatchMaterialPayload {
    tags?: string[];
    ai_summary?: string;
  }
  
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

    

export interface UserStats {
  total_materials: number;
  total_summaries: number;
  total_tagged: number;
  total_words: number;
}

export const fetchUserStats = (token: string): Promise<UserStats> =>
  fetchJson<UserStats>("/users/me/stats", token);
