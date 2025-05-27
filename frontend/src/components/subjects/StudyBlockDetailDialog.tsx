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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator"; // Pre vizuálne oddelenie
import { 
    Calendar, CheckCircle2, Hourglass, Loader2, Zap, XCircle, // Pridaj XCircle ak budeš mať "Preskočiť"
    BookOpen // Nové ikony pre lepšiu vizualizáciu
} from 'lucide-react';

// Pomocná funkcia na formátovanie enum hodnôt (zostáva rovnaká)
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

// Funkcia na získanie farby pre Badge podľa statusu
const getStatusBadgeVariant = (status: StudyBlockStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case StudyBlockStatus.COMPLETED: return "default"; // Často zelená v shadcn
        case StudyBlockStatus.IN_PROGRESS: return "secondary"; // Často modrá alebo neutrálna
        case StudyBlockStatus.SKIPPED: return "destructive"; // Červená
        case StudyBlockStatus.PLANNED:
        default: return "outline";
    }
};
const getStatusBadgeClass = (status: StudyBlockStatus): string => {
    switch (status) {
        case StudyBlockStatus.COMPLETED: return 'bg-green-500 border-green-500 hover:bg-green-600 text-white';
        case StudyBlockStatus.IN_PROGRESS: return 'bg-blue-500 border-blue-500 hover:bg-blue-600 text-white';
        case StudyBlockStatus.SKIPPED: return 'bg-red-500 border-red-500 hover:bg-red-600 text-white opacity-80';
        case StudyBlockStatus.PLANNED:
        default: return 'border-border';
    }
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
    if (isOpen && block) {
      setCurrentNotes(block.notes || "");
    }
  }, [isOpen, block]);

  if (!block) return null;

  const handleNotesSave = async () => {
    if (onUpdateNotes && currentNotes.trim() !== (block.notes || "").trim()) {
      await onUpdateNotes(block.id, currentNotes.trim());
    }
  };

  const hasNotesChanged = onUpdateNotes && currentNotes.trim() !== (block.notes || "").trim();

  const renderActionButton = (targetStatus: StudyBlockStatus, currentStatus: StudyBlockStatus, text: string, Icon: React.ElementType, variant: "default" | "secondary" | "destructive" | "outline" = "outline") => {
    // Nezobrazuj akciu, ak je to aktuálny stav (okrem "Znova plánovať" pre dokončené)
    if (targetStatus === currentStatus && targetStatus !== StudyBlockStatus.PLANNED) return null;
    // Ak je dokončený, zobraz len "Znova plánovať"
    if (currentStatus === StudyBlockStatus.COMPLETED && targetStatus !== StudyBlockStatus.PLANNED) return null;
    // Nezobrazuj "Začať" ak je už preskočený
    if (currentStatus === StudyBlockStatus.SKIPPED && targetStatus === StudyBlockStatus.IN_PROGRESS) return null;


    return (
        <Button
            className="w-full sm:w-auto"
            variant={variant}
            size="sm"
            onClick={async () => {
                await onUpdateStatus(block.id, targetStatus);
                if (isOpen && targetStatus === StudyBlockStatus.COMPLETED) onOpenChange(false); // Zavri len ak je dokončené
            }}
            disabled={isUpdating}
        >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Icon className="mr-2 h-4 w-4" />
            {text}
        </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg dark:bg-slate-900">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Detail Študijného Bloku
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 flex items-center pt-1">
            <BookOpen className="mr-2 h-4 w-4" />
            Téma: <strong className="ml-1 text-primary">{block.topic.name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2 space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
          
          {/* Sekcia Informácie o bloku */}
          <div className="space-y-2 p-3 border rounded-md bg-muted/20 dark:bg-slate-800/50">
            <h3 className="text-sm font-medium text-muted-foreground mb-1.5">Základné informácie</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Status:</span>
              <Badge 
                variant={getStatusBadgeVariant(block.status)} 
                className={`text-xs font-medium ${getStatusBadgeClass(block.status)}`}
              >
                  {formatEnumValue(block.status)}
              </Badge>
            </div>

            {block.scheduled_at && (
              <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Naplánované: </span>
                      {new Date(block.scheduled_at).toLocaleString('sk-SK', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
              </div>
            )}

            {block.duration_minutes && (
               <div className="flex items-center text-sm">
                  <Hourglass className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300"><span className="font-medium">Trvanie: </span>{block.duration_minutes} minút</span>
              </div>
            )}
          </div>

          {/* Sekcia Poznámky */}
          <div className="space-y-1.5 pt-2">
              <label htmlFor={`blockNotes-${block.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Vaše poznámky k tomuto bloku:
              </label>
              <Textarea 
                  id={`blockNotes-${block.id}`}
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  placeholder="Pridajte si poznámky, dôležité body alebo otázky..."
                  rows={5} // Viac riadkov pre poznámky
                  disabled={isUpdating}
                  className="text-sm resize-y min-h-[80px] bg-background dark:bg-slate-800 dark:border-slate-700 focus-visible:ring-primary"
              />
              {onUpdateNotes && (
                  <div className="flex justify-end pt-1">
                    <Button 
                        size="sm" 
                        variant="secondary" // Menej výrazné tlačidlo
                        onClick={handleNotesSave} 
                        disabled={isUpdating || !hasNotesChanged}
                        className="dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {hasNotesChanged ? "Uložiť Poznámky" : "Poznámky Uložené"}
                    </Button>
                  </div>
              )}
          </div>
        </div>

        <Separator className="my-3 dark:bg-slate-700" />

        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 pt-1">
            <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700" disabled={isUpdating}>
                    Zavrieť
                </Button>
            </DialogClose>
            {/* Akčné tlačidlá pre zmenu statusu */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {renderActionButton(StudyBlockStatus.COMPLETED, block.status, "Dokončené", CheckCircle2, "default")}
                {renderActionButton(StudyBlockStatus.IN_PROGRESS, block.status, "Začať Študovať", Zap, "outline")}
                {renderActionButton(StudyBlockStatus.PLANNED, block.status, "Znova Naplánovať", Hourglass, "outline")}
                {/* Pridaj tlačidlo na preskočenie, ak je relevantné */}
                {renderActionButton(StudyBlockStatus.SKIPPED, block.status, "Preskočiť", XCircle, "destructive")}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}