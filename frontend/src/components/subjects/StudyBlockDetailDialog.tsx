// frontend/src/components/subjects/StudyBlockDetailDialog.tsx
"use client";

import { useEffect, useState } from 'react';
import { StudyBlock } from '@/services/studyPlanService';
import { StudyBlockStatus } from '@/types/study';
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Calendar, CheckCircle2, Hourglass, Loader2, Zap } from 'lucide-react';

const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

interface StudyBlockDetailDialogProps {
  block: StudyBlock | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateStatus: (blockId: number, newStatus: StudyBlockStatus) => Promise<void>;
  onUpdateNotes?: (blockId: number, notes: string) => Promise<void>;
  isUpdating: boolean;
}

export default function StudyBlockDetailDialog({
  block,
  isOpen,
  onOpenChange,
  onUpdateStatus,
  onUpdateNotes,
  isUpdating
}: StudyBlockDetailDialogProps) {
  const [currentNotes, setCurrentNotes] = useState<string>("");

  useEffect(() => {
    if (isOpen && block) { // Naplň poznámky len keď sa dialóg otvorí a blok je dostupný
      setCurrentNotes(block.notes || "");
    }
    // Pri zatvorení dialógu sa currentNotes nemusia resetovať,
    // lebo useEffect ich nastaví znova pri ďalšom otvorení s novým `block` propom.
  }, [isOpen, block]);

  if (!block) return null;

  const handleNotesSave = async () => {
    if (onUpdateNotes && currentNotes !== (block.notes || "")) {
      await onUpdateNotes(block.id, currentNotes.trim());
      // Zváž, či tu nechať dialóg otvorený, aby používateľ videl, že sa uložilo,
      // alebo ho zatvoriť (onOpenChange(false))
    }
  };

  const hasNotesChanged = onUpdateNotes && currentNotes !== (block.notes || "");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Detail Študijného Bloku</DialogTitle>
          <DialogDescription className="pt-1">
            Téma: <strong className="text-foreground">{block.topic.name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-3 space-y-3 max-h-[60vh] overflow-y-auto pr-2"> {/* Max výška a scroll */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <Badge variant={ block.status === StudyBlockStatus.COMPLETED ? "default" : block.status === StudyBlockStatus.IN_PROGRESS ? "secondary" : block.status === StudyBlockStatus.SKIPPED ? "destructive" : "outline"} 
                   className={`text-xs ${block.status === StudyBlockStatus.COMPLETED ? 'bg-green-600 hover:bg-green-700' : ''} ${block.status === StudyBlockStatus.IN_PROGRESS ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
                {formatEnumValue(block.status)}
            </Badge>
          </div>

          {block.scheduled_at && (
            <div className="flex items-start">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-sm">
                    <span className="font-medium">Naplánované: </span>
                    {new Date(block.scheduled_at).toLocaleString('sk-SK', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
            </div>
          )}

          {block.duration_minutes && (
             <div className="flex items-center">
                <Hourglass className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm"><span className="font-medium">Trvanie: </span>{block.duration_minutes} minút</span>
            </div>
          )}

          <div className="space-y-1.5 pt-2">
              <label htmlFor={`blockNotes-${block.id}`} className="text-sm font-medium">
                Vaše poznámky k tomuto bloku:
              </label>
              <Textarea 
                  id={`blockNotes-${block.id}`}
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  placeholder="Žiadne poznámky..."
                  rows={4}
                  disabled={isUpdating}
                  className="text-sm resize-none" // Zakázanie menenia veľkosti
              />
              {onUpdateNotes && ( // Tlačidlo sa zobrazí len ak je onUpdateNotes definované
                  <div className="flex justify-end pt-1">
                    <Button 
                        size="sm" 
                        onClick={handleNotesSave} 
                        disabled={isUpdating || !hasNotesChanged} // Deaktivuj, ak nie sú zmeny
                    >
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Uložiť Poznámky
                    </Button>
                  </div>
              )}
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
            <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isUpdating}>Zavrieť</Button>
            </DialogClose>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* Tlačidlá na zmenu statusu */}
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
                {/* Ďalšie tlačidlá na zmenu statusu by tu mohli byť, ak je to potrebné */}
                 {block.status !== StudyBlockStatus.IN_PROGRESS && block.status !== StudyBlockStatus.COMPLETED && (
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={async () => { await onUpdateStatus(block.id, StudyBlockStatus.IN_PROGRESS); if(isOpen) onOpenChange(false);}} disabled={isUpdating}>
                        <Zap className="mr-2 h-4 w-4" /> Začať Študovať
                    </Button>
                )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}