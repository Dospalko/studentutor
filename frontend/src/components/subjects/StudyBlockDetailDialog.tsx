// frontend/src/components/subjects/StudyBlockDetailDialog.tsx
"use client";

import { useEffect, useState } from 'react';
import { StudyBlock } from '@/services/studyPlanService'; // Uisti sa, že cesta a typ sú správne
import { StudyBlockStatus } from '@/types/study'; // Uisti sa, že cesta a typ sú správne
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle2, Hourglass, Loader2 } from 'lucide-react';

// Pomocná funkcia na formátovanie enum hodnôt
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

interface StudyBlockDetailDialogProps {
  block: StudyBlock | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateStatus: (blockId: number, newStatus: StudyBlockStatus) => Promise<void>;
  onUpdateNotes?: (blockId: number, notes: string) => Promise<void>; // Pre úpravu poznámok
  isUpdating: boolean; // Indikátor, či prebieha nejaká aktualizácia na pozadí
  // onEditDateTime?: (block: StudyBlock) => void; // Placeholder pre budúcu editáciu času/dátumu
}

export default function StudyBlockDetailDialog({
  block,
  isOpen,
  onOpenChange,
  onUpdateStatus,
  onUpdateNotes,
  isUpdating,
  // onEditDateTime
}: StudyBlockDetailDialogProps) {
  const [currentNotes, setCurrentNotes] = useState<string>("");

  useEffect(() => {
    if (block) {
      setCurrentNotes(block.notes || "");
    } else {
      setCurrentNotes(""); // Resetuj, ak nie je blok
    }
  }, [block]); // Závislosť na bloku

  if (!block) return null; // Ak nie je blok, nič nezobrazuj

  const handleNotesSave = async () => {
    if (onUpdateNotes && currentNotes !== (block.notes || "")) {
      await onUpdateNotes(block.id, currentNotes.trim());
      // onOpenChange(false); // Zváž, či zatvoriť dialóg po uložení poznámok
    }
  };

  const canSaveChanges = onUpdateNotes && currentNotes !== (block.notes || "");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg"> {/* Trochu širší dialóg */}
        <DialogHeader>
          <DialogTitle className="text-xl">Detail Študijného Bloku</DialogTitle>
          <DialogDescription className="pt-1">
            Téma: <strong className="text-foreground">{block.topic.name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 grid gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <Badge variant={ block.status === StudyBlockStatus.COMPLETED ? "default" : block.status === StudyBlockStatus.IN_PROGRESS ? "secondary" : block.status === StudyBlockStatus.SKIPPED ? "destructive" : "outline"} 
                   className={`text-xs ${block.status === StudyBlockStatus.COMPLETED ? 'bg-green-600 hover:bg-green-700' : ''} ${block.status === StudyBlockStatus.IN_PROGRESS ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
                {formatEnumValue(block.status)}
            </Badge>
          </div>

          {block.scheduled_at && (
            <div className="flex items-start">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                    <span className="font-medium">Naplánované: </span>
                    {new Date(block.scheduled_at).toLocaleString('sk-SK', { dateStyle: 'full', timeStyle: 'short' })}
                    {/* TODO: Placeholder pre tlačidlo na editáciu dátumu/času 
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => onEditDateTime?.(block)}>
                        <Edit className="h-3.5 w-3.5" />
                    </Button>
                    */}
                </div>
            </div>
          )}

          {block.duration_minutes && (
             <div className="flex items-center">
                <Hourglass className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-sm"><span className="font-medium">Trvanie: </span>{block.duration_minutes} minút</span>
            </div>
          )}

          {/* Úprava poznámok */}
          <div className="space-y-1.5 pt-2">
              <label htmlFor={`blockNotes-${block.id}`} className="text-sm font-medium">Vaše poznámky k tomuto bloku:</label>
              <Textarea 
                  id={`blockNotes-${block.id}`}
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  placeholder="Žiadne poznámky..."
                  rows={4}
                  disabled={isUpdating}
                  className="text-sm"
              />
              {onUpdateNotes && canSaveChanges && (
                  <Button size="sm" onClick={handleNotesSave} disabled={isUpdating} className="mt-2">
                      {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Uložiť Poznámky
                  </Button>
              )}
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
            <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isUpdating}>Zavrieť</Button>
            </DialogClose>
            {/* Akcie na zmenu statusu */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {block.status !== StudyBlockStatus.COMPLETED && (
                    <Button className="w-full sm:w-auto" variant="default" size="sm" onClick={async () => { await onUpdateStatus(block.id, StudyBlockStatus.COMPLETED); if(isOpen) onOpenChange(false); }} disabled={isUpdating}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />Označiť ako Dokončené
                    </Button>
                )}
                 {block.status === StudyBlockStatus.COMPLETED && (
                     <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={async () => { await onUpdateStatus(block.id, StudyBlockStatus.PLANNED); if(isOpen) onOpenChange(false);}} disabled={isUpdating}>
                       <Hourglass className="mr-2 h-4 w-4" />Znova Naplánovať
                     </Button>
                )}
                {/* Ďalšie akcie pre IN_PROGRESS a SKIPPED by tu mohli byť tiež, ak je dialóg hlavným miestom pre interakciu */}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}