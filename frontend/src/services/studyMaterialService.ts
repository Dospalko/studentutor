// frontend/src/services/studyMaterialService.ts
import { MaterialTypeEnum } from '@/types/study';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  extracted_text?: string | null; // Pre budúcu AI prácu
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
}

export const uploadStudyMaterial = async (
  subjectId: number,
  file: File,
  metadata: StudyMaterialMetadata,
  token: string
): Promise<StudyMaterial> => {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata.title != null && metadata.title.trim() !== "") formData.append('title', metadata.title.trim());
  if (metadata.description != null && metadata.description.trim() !== "") formData.append('description', metadata.description.trim());
  if (metadata.material_type != null) formData.append('material_type', metadata.material_type);

  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/materials/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Nahrávanie súboru zlyhalo' }));
    throw new Error(errorData.detail || 'Nahrávanie súboru zlyhalo');
  }
  return response.json();
};
   
export const getStudyMaterialsForSubject = async (subjectId: number, token: string): Promise<StudyMaterial[]> => {
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/materials/`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Načítanie materiálov zlyhalo' }));
    throw new Error(errorData.detail || 'Načítanie materiálov zlyhalo');
  }
  return response.json();
};

export const deleteStudyMaterial = async (materialId: number, token: string): Promise<StudyMaterial> => {
  const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Zmazanie materiálu zlyhalo' }));
    throw new Error(errorData.detail || 'Zmazanie materiálu zlyhalo');
  }
  return response.json(); 
};

// fetchProtectedFileAsBlobUrl - použijeme pre zobrazenie PDF
export const fetchProtectedFileAsBlobUrl = async (
  materialId: number,
  token: string
): Promise<{ blobUrl: string, fileType: string | null }> => {
  const response = await fetch(`${API_BASE_URL}/materials/${materialId}/download`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    let errorDetail = `Nepodarilo sa načítať súbor. Status: ${response.status}`;
    try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch {}
    throw new Error(errorDetail);
  }
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const fileType = response.headers.get('content-type');
  return { blobUrl, fileType };
};

export const downloadProtectedFile = async (
  materialId: number,
  filenameToSave: string,
  token: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/materials/${materialId}/download`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    let errorDetail = `Sťahovanie súboru zlyhalo. Status: ${response.status}`;
    try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch {}
    throw new Error(errorDetail);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filenameToSave;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const getMaterialSummary = async (materialId: number, token: string): Promise<MaterialSummaryResponse> => {
    const response = await fetch(`${API_BASE_URL}/materials/${materialId}/summary`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Nepodarilo sa získať AI sumarizáciu' }));
        throw new Error(errorData.detail || 'Nepodarilo sa získať AI sumarizáciu');
    }
    return response.json();
};
export const generateMaterialSummary = async (
  materialId: number,
  token: string
): Promise<MaterialSummaryResponse> => {
  // voláme rovnaký endpoint; backend by mal summary uložiť/cache-ovať
  const res = await fetch(`${API_BASE_URL}/materials/${materialId}/summary`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "AI sumarizácia zlyhala" }))
    throw new Error(err.detail || "AI sumarizácia zlyhala")
  }
  return res.json()
}

export const generateMaterialTags = async (
  materialId: number,
  token: string
): Promise<string[]> => {
  const response = await fetch(`${API_BASE_URL}/materials/${materialId}/generate-tags`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Nepodarilo sa získať tagy' }));
    throw new Error(errorData.detail || 'Nepodarilo sa získať tagy');
  }
  return response.json();
};
