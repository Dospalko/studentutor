// frontend/src/components/subjects/details/StudyMaterialsSection.tsx
"use client";

import { useState, useEffect, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { StudyMaterial, deleteStudyMaterial as deleteMaterialServiceFunc, getStudyMaterialsForSubject } from "@/services/studyMaterialService";
import StudyMaterialUploadForm from "@/components/subjects/StudyMaterialUploadForm"; // Predpokladáme existenciu
import StudyMaterialList from "@/components/subjects/StudyMaterialList"; // Predpokladáme existenciu
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert  } from "@/components/ui/alert";
import { UploadCloud, AlertCircle,  } from "lucide-react";

interface StudyMaterialsSectionProps {
  subjectId: number | undefined;
  initialMaterials?: StudyMaterial[]; // Ak sa načítavajú s predmetom
}

export default function StudyMaterialsSection({ subjectId, initialMaterials = [] }: StudyMaterialsSectionProps) {
  const authContext = useContext(AuthContext);
  const [materials, setMaterials] = useState<StudyMaterial[]>(initialMaterials);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Pre samostatné načítavanie/akcie

  // Ak by si chcel materiály načítavať samostatne a nie spolu s predmetom:
  useEffect(() => {
    if (subjectId && authContext?.token && initialMaterials.length === 0) { // Načítaj len ak nie sú poskytnuté
      setIsLoading(true);
      setError(null);
      getStudyMaterialsForSubject(subjectId, authContext.token)
        .then(setMaterials)
        .catch(err => setError((err as Error).message || "Chyba pri načítaní materiálov."))
        .finally(() => setIsLoading(false));
    } else {
        setMaterials(initialMaterials); // Nastav z props, ak sú
    }
  }, [subjectId, authContext?.token, initialMaterials]);


  const handleMaterialUploadSuccess = (newMaterial: StudyMaterial) => {
    setMaterials(prev => [newMaterial, ...prev].sort((a,b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()));
    setError(null);
  };

  const handleDeleteMaterial = async (materialId: number) => {
    if (!authContext?.token) return;
    if (!window.confirm('Naozaj chcete zmazať tento študijný materiál?')) return;
    setError(null);
    setIsLoading(true); // Indikátor pre akciu mazania
    try {
      await deleteMaterialServiceFunc(materialId, authContext.token);
      setMaterials(prev => prev.filter(m => m.id !== materialId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodarilo sa zmazať materiál.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center">
          <UploadCloud className="mr-2 h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">Študijné Materiály</CardTitle>
        </div>
        <CardDescription>
          Nahrajte a spravujte svoje PDF súbory, skriptá a iné materiály k tomuto predmetu.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6 lg:gap-8 pt-2">
        <div className="md:col-span-1">
          <h4 className="text-md font-semibold mb-2 text-muted-foreground border-b pb-1">Pridať Nový Materiál</h4>
          {subjectId && authContext?.token && (
            <StudyMaterialUploadForm
              subjectId={subjectId}
              onUploadSuccess={handleMaterialUploadSuccess}
              token={authContext.token}
            />
          )}
        </div>
        <div className="md:col-span-2">
           <h4 className="text-md font-semibold mb-2 text-muted-foreground border-b pb-1">Nahrané Materiály</h4>
           {error && <Alert variant="destructive" className="mb-4"><AlertCircle className="h-4 w-4 mr-2"/>{error}</Alert>}
           <StudyMaterialList
              materials={materials}
              onDeleteMaterial={handleDeleteMaterial}
              isLoading={isLoading} // Ak isLoading reprezentuje aj akcie
           />
        </div>
      </CardContent>
    </Card>
  );
}