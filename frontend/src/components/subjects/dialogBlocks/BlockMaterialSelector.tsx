// frontend/src/components/subjects/dialogBlocks/BlockMaterialSelector.tsx
"use client";

import { useState, useEffect, useContext } from "react";
import { StudyMaterial, getStudyMaterialsForSubject } from "@/services/studyMaterialService";
import { AuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Paperclip, Loader2 } from "lucide-react";

interface BlockMaterialSelectorProps {
  subjectId: number; // Potrebné na načítanie materiálov
  initialMaterialId: number | null | undefined;
  onSaveMaterial: (materialId: number | null) => Promise<void>;
  isUpdating: boolean;
}

export default function BlockMaterialSelector({ subjectId, initialMaterialId, onSaveMaterial, isUpdating }: BlockMaterialSelectorProps) {
  const authContext = useContext(AuthContext);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("none");
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  useEffect(() => {
    setSelectedMaterialId(initialMaterialId ? String(initialMaterialId) : "none");
  }, [initialMaterialId]);

  useEffect(() => {
    if (subjectId && authContext?.token) {
      setIsLoadingMaterials(true);
      getStudyMaterialsForSubject(subjectId, authContext.token)
        .then((data) => setMaterials(data))
        .catch((err) => {
          console.error("Failed to fetch materials for selector:", err);
          setMaterials([]);
        })
        .finally(() => setIsLoadingMaterials(false));
    } else {
        setMaterials([]); // Ak nie je subjectId alebo token, vyprázdni materiály
    }
  }, [subjectId, authContext?.token]);

  const handleSave = async () => {
    const materialIdToSave = selectedMaterialId === "none" ? null : Number(selectedMaterialId);
    await onSaveMaterial(materialIdToSave);
  };

  const hasChanged = selectedMaterialId !== (initialMaterialId ? String(initialMaterialId) : "none");

  return (
    <div className="space-y-2">
      <Label htmlFor="block-material-selector" className="text-sm font-medium flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        Priradený Materiál
      </Label>
      {isLoadingMaterials ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Načítavam materiály...</span></div>
      ) : materials.length === 0 && selectedMaterialId === "none" ? ( // Zobrazí sa len ak nie sú materiály a nič nie je vybrané
        <p className="text-xs text-muted-foreground italic">Pre tento predmet neboli nájdené žiadne materiály. Najprv ich nahrajte na stránke predmetu.</p>
      ) : (
        <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId} disabled={isUpdating || materials.length === 0 && selectedMaterialId === "none"}>
          <SelectTrigger id="block-material-selector" className="w-full"><SelectValue placeholder="Vyberte materiál..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Žiadny (odobrat priradenie)</SelectItem>
            {materials.map((mat) => (
              <SelectItem key={mat.id} value={String(mat.id)}>
                {mat.title || mat.file_name} ({((mat.file_size ?? 0) / 1024).toFixed(1)} KB)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {/* Tlačidlo zobrazíme, len ak je čo ukladať (sú materiály alebo chceme odobrať) A nastala zmena */}
      {(materials.length > 0 || initialMaterialId !== null) && (
         <Button size="sm" variant="secondary" onClick={handleSave} disabled={isUpdating || !hasChanged} className="mt-2">
            {isUpdating && hasChanged && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasChanged ? "Uložiť Výber Materiálu" : "Výber Uložený"}
         </Button>
      )}
    </div>
  );
}