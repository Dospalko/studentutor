// frontend/src/components/subjects/StudyBlockDetailDialog.tsx
"use client";

import { useEffect } from "react"; // Odstránený useContext, ak ho tu priamo nepotrebuješ
import type { StudyBlock } from "@/services/studyPlanService";
import { StudyBlockStatus } from "@/types/study";
// Importy pre sub-komponenty
import BlockStatusInfo from "../dialogBlocks/BlockStatusInfo";
import BlockScheduleEditor from "../dialogBlocks/BlockScheduleEditor";
import BlockNotesEditor from "../dialogBlocks/BlockNotesEditor";
import BlockMaterialSelector from "../dialogBlocks/BlockMaterialSelector";
import BlockActionButtons from "../dialogBlocks/BlockActionButtons";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Target } from "lucide-react";


interface StudyBlockDetailDialogProps {
  block: StudyBlock | null;
  subjectName?: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateStatus: (blockId: number, newStatus: StudyBlockStatus) => Promise<void>;
  onUpdateNotes: (blockId: number, notes: string | null) => Promise<void>; // Povolíme null na vymazanie
  onUpdateSchedule: (blockId: number, newStart: Date) => Promise<void>;
  onAssignMaterial?: (blockId: number, materialId: number | null) => Promise<void>;
  isUpdating: boolean; // Jeden globálny isUpdating pre všetky akcie v dialógu
}

export default function StudyBlockDetailDialog({
  block,
  subjectName,
  isOpen,
  onOpenChange,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateSchedule,
  onAssignMaterial,
  isUpdating,
}: StudyBlockDetailDialogProps) {

  useEffect(() => {
    if (!isOpen) {
      // Tu môžeš resetovať interné stavy sub-komponentov, ak by to bolo potrebné,
      // ale lepšie je, aby si sub-komponenty resetovali stavy samy pri zmene `block` propu.
    }
  }, [isOpen]);

  if (!block) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Target className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold leading-tight">Detail Študijného Bloku</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span className="break-words">Téma: <strong className="text-primary">{block.topic.name}</strong></span>
              </DialogDescription>
              {subjectName && <DialogDescription className="text-xs">Predmet: {subjectName}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <BlockStatusInfo block={block} />
          
          <BlockScheduleEditor 
            initialScheduledAt={block.scheduled_at}
            onSaveSchedule={(newDate) => onUpdateSchedule(block.id, newDate)}
            isUpdating={isUpdating}
          />
          
          <BlockNotesEditor
            blockId={block.id}
            initialNotes={block.notes}
            onSaveNotes={(notes) => onUpdateNotes(block.id, notes)}
            isUpdating={isUpdating}
          />
          
          <BlockMaterialSelector
            subjectId={block.subject_id} // Predpokladáme, že StudyBlock má subject_id
            initialMaterialId={block.material_id}
            onSaveMaterial={
              onAssignMaterial
                ? (materialId) => onAssignMaterial(block.id, materialId)
                : async () => {}
            }
            isUpdating={isUpdating}
          />
        </div>

        <Separator className="my-4" />
        <DialogFooter className="p-6 pt-0 flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:space-x-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isUpdating}>Zavrieť</Button>
          </DialogClose>
          <BlockActionButtons
            currentStatus={block.status}
            blockId={block.id}
            onUpdateStatus={onUpdateStatus}
            isUpdating={isUpdating}
            onDialogClose={() => onOpenChange(false)} // Zavrie dialóg po dokončení
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}