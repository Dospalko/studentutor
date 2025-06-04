// frontend/src/components/subjects/StudyMaterialList.tsx
"use client";

import { StudyMaterial, getStudyMaterialDownloadUrl } from '@/services/studyMaterialService';
import { Button } from "@/components/ui/button";
import { Card} from "@/components/ui/card";
import { FileText, Download, Trash2, AlertCircle,Loader2 } from "lucide-react";
import { Badge } from '@/components/ui/badge';

// Pomocná funkcia na formátovanie enum hodnôt
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value || typeof value !== 'string') return 'N/A';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

interface StudyMaterialListProps {
  materials: StudyMaterial[];
  onDeleteMaterial: (materialId: number) => Promise<void>; // Callback na zmazanie
  isLoading?: boolean; // Ak by načítavanie materiálov bolo oddelené
  error?: string | null;
}

export default function StudyMaterialList({ materials, onDeleteMaterial, isLoading, error }: StudyMaterialListProps) {
  
  if (isLoading) {
    return <div className="py-4 text-center text-muted-foreground">Načítavam materiály... <Loader2 className="inline h-4 w-4 animate-spin"/></div>;
  }

  if (error) {
    return <div className="py-4 text-destructive flex items-center justify-center"><AlertCircle className="h-4 w-4 mr-2"/> {error}</div>;
  }
  
  if (materials.length === 0) {
    return <p className="py-4 text-sm text-center text-muted-foreground">K tomuto predmetu zatiaľ neboli pridané žiadne študijné materiály.</p>;
  }

  return (
    <div className="space-y-3">
      {materials.map(material => (
        <Card key={material.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-3">
          <div className="flex items-center gap-3 flex-grow min-w-0"> {/* min-w-0 pre správne zalomenie textu */}
            <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary flex-shrink-0" />
            <div className="flex-grow overflow-hidden"> {/* overflow-hidden pre zalomenie dlhých názvov */}
              <h4 className="text-sm sm:text-md font-semibold truncate" title={material.title || material.file_name}>
                {material.title || material.file_name}
              </h4>
              <div className="text-xs text-muted-foreground space-x-2">
                <span>{material.file_size ? (material.file_size / 1024).toFixed(1) : '0'} KB</span>
                {material.material_type && <Badge variant="outline" className="px-1.5 py-0.5 text-xs">{formatEnumValue(material.material_type)}</Badge>}
                <span>Nahrané: {new Date(material.uploaded_at).toLocaleDateString('sk-SK')}</span>
              </div>
              {material.description && <p className="text-xs text-muted-foreground mt-0.5 italic line-clamp-1">{material.description}</p>}
            </div>
          </div>
          <div className="flex space-x-2 mt-2 sm:mt-0 flex-shrink-0">
            <a
              href={getStudyMaterialDownloadUrl(material.id)}
              target="_blank" // Otvorí v novom tabe alebo spustí download
              rel="noopener noreferrer"
              // download // Atribút download môže vynútiť stiahnutie namiesto zobrazenia v prehliadači
            >
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-4 w-4" /> Stiahnuť
              </Button>
            </a>
            <Button variant="destructive" size="sm" onClick={() => onDeleteMaterial(material.id)}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Zmazať
            </Button>
            {/* TODO: Tlačidlo na úpravu metadát materiálu */}
          </div>
        </Card>
      ))}
    </div>
  );
}