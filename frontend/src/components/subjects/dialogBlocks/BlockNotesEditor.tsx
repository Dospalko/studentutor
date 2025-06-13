// frontend/src/components/subjects/dialogBlocks/BlockNotesEditor.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2 } from "lucide-react";

interface BlockNotesEditorProps {
  blockId: number; // Potrebné pre unikátne ID Textarea
  initialNotes: string | null | undefined;
  onSaveNotes: (notes: string | null) => Promise<void>; // null na vymazanie
  isUpdating: boolean;
}

export default function BlockNotesEditor({ blockId, initialNotes, onSaveNotes, isUpdating }: BlockNotesEditorProps) {
  const [currentNotes, setCurrentNotes] = useState("");

  useEffect(() => {
    setCurrentNotes(initialNotes || "");
  }, [initialNotes]);

  const handleSave = async () => {
    const notesToSave = currentNotes.trim() === "" ? null : currentNotes.trim();
    await onSaveNotes(notesToSave);
  };

  const hasChanged = currentNotes.trim() !== (initialNotes || "").trim();

  return (
    <div className="space-y-2">
      <Label htmlFor={`blockNotes-editor-${blockId}`} className="text-sm font-medium flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Vaše poznámky
      </Label>
      <Textarea
        id={`blockNotes-editor-${blockId}`}
        value={currentNotes}
        onChange={(e) => setCurrentNotes(e.target.value)}
        placeholder="Pridajte si poznámky, dôležité body alebo otázky..."
        rows={3}
        disabled={isUpdating}
        className="resize-y min-h-[60px]"
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleSave}
          disabled={isUpdating || !hasChanged}
        >
          {isUpdating && hasChanged && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {hasChanged ? "Uložiť Poznámky" : "Poznámky Uložené"}
        </Button>
      </div>
    </div>
  );
}