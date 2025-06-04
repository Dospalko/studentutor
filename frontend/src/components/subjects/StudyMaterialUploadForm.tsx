// frontend/src/components/subjects/StudyMaterialUploadForm.tsx
"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UploadCloud, FileText } from "lucide-react";
import { MaterialTypeEnum } from "@/types/study";
import { StudyMaterialMetadata } from "@/services/studyMaterialService";
import { StudyMaterial } from "@/services/studyMaterialService";
// Pomocná funkcia na formátovanie enum hodnôt
const formatEnumValue = (value: string): string => {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

interface StudyMaterialUploadFormProps {
  subjectId: number;
  onUploadSuccess: (newMaterial: StudyMaterial) => void; // ⬅️ zmeň unknown → StudyMaterial
  token: string | null;
}

export default function StudyMaterialUploadForm({
  subjectId,
  onUploadSuccess,
  token,
}: StudyMaterialUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materialType, setMaterialType] = useState<MaterialTypeEnum | "">("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      // Automaticky vyplň titulok názvom súboru (bez koncovky), ak je prázdny
      if (!title.trim()) {
        const fileNameWithoutExtension = event.target.files[0].name
          .split(".")
          .slice(0, -1)
          .join(".");
        setTitle(fileNameWithoutExtension || event.target.files[0].name);
      }
      setError(null); // Vyčisti chybu pri výbere nového súboru
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Prosím, vyberte súbor na nahratie.");
      return;
    }
    if (!token) {
      setError("Chyba autentifikácie. Skúste sa znova prihlásiť.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const metadata: StudyMaterialMetadata = {
      title: title.trim() || undefined, // Pošli undefined, ak je prázdne, backend to môže ignorovať
      description: description.trim() || undefined,
      material_type: materialType || undefined,
    };

    try {
      // Importni si uploadStudyMaterial zo svojho servisu
      const { uploadStudyMaterial } = await import(
        "@/services/studyMaterialService"
      );
      const newMaterial = await uploadStudyMaterial(
        subjectId,
        selectedFile,
        metadata,
        token
      );
      onUploadSuccess(newMaterial); // Informuj rodiča o úspechu
      // Resetuj formulár
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setMaterialType("");
      // Nuluj input file element, aby sa dal nahrať rovnaký súbor znova
      const fileInput = document.getElementById(
        "material-file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("Upload failed:", err);
      setError(
        err instanceof Error ? err.message : "Neznáma chyba pri nahrávaní."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-1 border rounded-lg bg-card"
    >
      <div className="space-y-1.5">
        <Label htmlFor="material-file-input">
          Súbor <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center space-x-2">
          <Input
            id="material-file-input"
            type="file"
            onChange={handleFileChange}
            required
            className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
          />
        </div>
        {selectedFile && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            <FileText className="h-3 w-3 mr-1" /> Vybrané: {selectedFile.name} (
            {(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="material-title">Názov materiálu (voliteľné)</Label>
        <Input
          id="material-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Napr. Prednáška 1: Úvod do..."
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="material-type">Typ materiálu (voliteľné)</Label>
        <Select
          value={materialType}
          onValueChange={(value) =>
            setMaterialType(value === "none" ? "" : (value as MaterialTypeEnum))
          } >
          <SelectTrigger id="material-type">
            <SelectValue placeholder="Vyberte typ" />
          </SelectTrigger>
          <SelectContent>
            {/* ZOZNAM ENUM HODNÔT */}
            {Object.values(MaterialTypeEnum).map((type) => (
              <SelectItem key={type} value={type}>
                {formatEnumValue(type)}
              </SelectItem>
            ))}
            {/* voliteľne doplň "Žiadny" so špeciálnou hodnotou, nie prázdnou */}
            <SelectItem value="none">Žiadny</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="material-description">Popis (voliteľné)</Label>
        <Textarea
          id="material-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Stručný popis obsahu materiálu..."
          rows={2}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={isUploading || !selectedFile}
        className="w-full"
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="mr-2 h-4 w-4" />
        )}
        {isUploading ? "Nahrávam..." : "Nahrať materiál"}
      </Button>
    </form>
  );
}
