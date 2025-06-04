// frontend/src/services/studyMaterialService.ts
import { MaterialTypeEnum } from '@/types/study'; // Predpokladáme, že MaterialTypeEnum je v types/study.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Typy zodpovedajúce backend schémam
export interface StudyMaterial {
  id: number;
  file_name: string;
  file_type?: string | null;
  file_size?: number | null;
  uploaded_at: string; // ISO string dátumu
  title?: string | null;
  description?: string | null;
  material_type?: MaterialTypeEnum | null;
  subject_id: number;
  owner_id: number;
}

// Pre metadáta posielané s formulárom (bez súboru)
export interface StudyMaterialMetadata {
  title?: string | null;
  description?: string | null;
  material_type?: MaterialTypeEnum | null;
}

// Funkcia na nahratie študijného materiálu k predmetu
export const uploadStudyMaterial = async (
  subjectId: number,
  file: File, // Objekt súboru z <input type="file">
  metadata: StudyMaterialMetadata,
  token: string
): Promise<StudyMaterial> => {
  const formData = new FormData();
  formData.append('file', file); // Kľúč 'file' musí zodpovedať názvu parametra v FastAPI endpointu

  // Pridaj metadáta do formData, ak sú definované
  if (metadata.title !== undefined && metadata.title !== null) {
    formData.append('title', metadata.title);
  }
  if (metadata.description !== undefined && metadata.description !== null) {
    formData.append('description', metadata.description);
  }
  if (metadata.material_type !== undefined && metadata.material_type !== null) {
    formData.append('material_type', metadata.material_type);
  }

  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/materials/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // 'Content-Type': 'multipart/form-data' sa nastaví automaticky prehliadačom pri použití FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to upload study material' }));
    throw new Error(errorData.detail || 'Failed to upload study material');
  }
  return response.json();
};

// Funkcia na získanie všetkých materiálov pre predmet
// (Túto už možno máš, ak `getSubjectById` vracia materiály)
// Ak nie, alebo chceš samostatnú funkciu:
export const getStudyMaterialsForSubject = async (subjectId: number, token: string): Promise<StudyMaterial[]> => {
  const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/materials/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch materials' }));
    throw new Error(errorData.detail || 'Failed to fetch materials');
  }
  return response.json();
};


// Funkcia na zmazanie študijného materiálu
export const deleteStudyMaterial = async (materialId: number, token: string): Promise<StudyMaterial> => {
  // Backend vracia zmazaný materiál, preto Promise<StudyMaterial>
  const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, { // Použi prefix /materials/
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Failed to delete material' }));
    throw new Error(errorData.detail || 'Failed to delete material');
  }
  if (response.status === 204) { // Ak by backend vracal 204 No Content
      return { id: materialId } as StudyMaterial; // Vráť aspoň ID pre aktualizáciu UI
  }
  return response.json();
};

// URL pre stiahnutie súboru (otvorí sa v novom okne alebo spustí download)
// Táto funkcia priamo nespúšťa fetch, len generuje URL
export const getStudyMaterialDownloadUrl = (materialId: number): string => {
  return `${API_BASE_URL}/materials/${materialId}/download`;
};

// Funkcia na update metadát materiálu (ak by si ju implementoval)
// export const updateStudyMaterialMetadata = async (materialId: number, metadata: StudyMaterialMetadata, token: string): Promise<StudyMaterial> => { ... }