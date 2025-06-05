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
}

export interface StudyMaterialMetadata {
  title?: string | null;
  description?: string | null;
  material_type?: MaterialTypeEnum | null;
}

export interface GeneratePlanOptions {
  forceRegenerate?: boolean;
}

export const uploadStudyMaterial = async (
  subjectId: number,
  file: File,
  metadata: StudyMaterialMetadata,
  token: string
): Promise<StudyMaterial> => {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata.title != null) formData.append('title', metadata.title);
  if (metadata.description != null) formData.append('description', metadata.description);
  if (metadata.material_type != null) formData.append('material_type', metadata.material_type);

  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/materials/`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to upload' }));
    throw new Error(errorData.detail || 'Failed to upload study material');
  }
  return response.json();
};
   
export const getStudyMaterialsForSubject = async (subjectId: number, token: string): Promise<StudyMaterial[]> => {
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/materials/`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch' }));
    throw new Error(errorData.detail || 'Failed to fetch materials');
  }
  return response.json();
};

export const deleteStudyMaterial = async (materialId: number, token: string): Promise<StudyMaterial> => {
  const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete' }));
    throw new Error(errorData.detail || 'Failed to delete material');
  }
  if (response.status === 204) return { id: materialId } as StudyMaterial;
  return response.json();
};

export const fetchProtectedFileAsBlobUrl = async (
  materialId: number,
  token: string
): Promise<{ blobUrl: string, fileType: string | null }> => {
  const response = await fetch(`${API_BASE_URL}/materials/${materialId}/download`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch file. Status: ${response.status}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) {}
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
    let errorDetail = `Failed to download file. Status: ${response.status}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    try { const errorData = await response.json(); errorDetail = errorData.detail || errorDetail; } catch (e) {}
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