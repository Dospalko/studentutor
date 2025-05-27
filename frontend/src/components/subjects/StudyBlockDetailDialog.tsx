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
import { Separator } from "@/components/ui/separator";
import { 
    Calendar, CheckCircle2, Hourglass, Loader2, Zap, XCircle,
    BookOpen, Info 
} from 'lucide-react';

const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const getStatusBadgeVariant = (status: StudyBlockStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case StudyBlockStatus.COMPLETED: return "default";
        case StudyBlockStatus.IN_PROGRESS: return "secondary";
        case StudyBlockStatus.SKIPPED: return "destructive";
        case StudyBlockStatus.PLANNED: default: return "outline";
    }
};
const getStatusBadgeClass = (status: StudyBlockStatus): string => {
    switch (status) {
        case StudyBlockStatus.COMPLETED: return 'bg-green-500 border-green-500 hover:bg-green-600 text-white';
        case StudyBlockStatus.IN_PROGRESS: return 'bg-blue-500 border-blue-500 hover:bg-blue-600 text-white';
        case StudyBlockStatus.SKIPPED: return 'bg-red-500 border-red-500 hover:bg-red-600 text-white opacity-80';
        case StudyBlockStatus.PLANNED: default: return 'border-border';
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
    if (targetStatus === currentStatus && targetStatus !== StudyBlockStatus.PLANNED) return null;
    if (currentStatus === StudyBlockStatus.COMPLETED && targetStatus !== StudyBlockStatus.PLANNED) return null;
    if (currentStatus === StudyBlockStatus.SKIPPED && targetStatus === StudyBlockStatus.IN_PROGRESS) return null;

    return (
        <Button
            className="w-full" // Na malých obrazovkách budú tlačidlá pod sebou na celú šírku
            variant={variant}
            size="sm"
            onClick={async () => {
                await onUpdateStatus(block.id, targetStatus);
                if (isOpen && targetStatus === StudyBlockStatus.COMPLETED) onOpenChange(false);
            }}
            disabled={isUpdating}
        >
            {isUpdating && targetStatus === block.status && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {/* Loader len pre aktívne tlačidlo */}
            <Icon className="mr-2 h-4 w-4" />
            {text}
        </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* `sm:max-w-lg` pre väčšie obrazovky, defaultne bude užší */}
      <DialogContent className="w-[90vw] max-w-lg dark:bg-slate-900">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 leading-tight">
            Detail Študijného Bloku
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-start pt-1">
            <BookOpen className="mr-2 h-4 w-4 mt-0.5 shrink-0" />
            {/* `break-words` pre zalamovanie dlhých názvov tém */}
            <span className="break-words">
                Téma: <strong className="text-primary">{block.topic.name}</strong>
            </span>
          </DialogDescription>
        </DialogHeader>
        
        {/* `max-h-[calc(100vh-16rem)]` alebo podobne pre výšku obsahu na rôznych zariadeniach */}
        <div className="py-2 space-y-3 max-h-[60vh] sm:max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
          
          <div className="space-y-1.5 p-3 border rounded-md bg-muted/20 dark:bg-slate-800/50">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Základné informácie</h3>
            
            <div className="flex items-center justify-between text-sm min-h-[2rem]"> {/* min-height pre konzistentnú výšku */}
              <span className="text-gray-600 dark:text-gray-300 flex items-center">
                <Info className="mr-2 h-4 w-4 shrink-0" /> Status:
              </span>
              <Badge 
                variant={getStatusBadgeVariant(block.status)} 
                className={`text-xs font-medium ml-2 ${getStatusBadgeClass(block.status)}`}
              >
                  {formatEnumValue(block.status)}
              </Badge>
            </div>

            {block.scheduled_at && (
              <div className="flex items-start text-sm min-h-[2rem]">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Naplánované: </span>
                      {/* `break-words` pre prípad veľmi dlhého formátu dátumu/času na úzkych obrazovkách */}
                      <span className="break-words">
                        {new Date(block.scheduled_at).toLocaleString('sk-SK', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                  </div>
              </div>
            )}

            {block.duration_minutes !== null && block.duration_minutes !== undefined && ( // Prísnejšia kontrola
               <div className="flex items-center text-sm min-h-[2rem]">
                  <Hourglass className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300"><span className="font-medium">Trvanie: </span>{block.duration_minutes} minút</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2">
              <label htmlFor={`blockNotes-${block.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Vaše poznámky:
              </label>
              <Textarea 
                  id={`blockNotes-${block.id}`}
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  placeholder="Pridajte si poznámky, dôležité body alebo otázky..."
                  rows={4} // Menší počet riadkov, keďže je scroll
                  disabled={isUpdating}
                  className="text-sm resize-y min-h-[60px] w-full bg-background dark:bg-slate-800 dark:border-slate-700 focus-visible:ring-primary"
              />
              {onUpdateNotes && (
                  <div className="flex justify-end pt-1">
                    <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={handleNotesSave} 
                        disabled={isUpdating || !hasNotesChanged}
                        className="dark:text-gray-300 dark:hover:bg-slate-700"
                    >
                        {isUpdating && currentNotes !== (block.notes || "") && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {/* Loader len ak sa ukladajú poznámky */}
                        {hasNotesChanged ? "Uložiť Poznámky" : "Poznámky Uložené"}
                    </Button>
                  </div>
              )}
          </div>
        </div>

        <Separator className="my-3 dark:bg-slate-700" />

        <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:space-x-2 pt-1">
            <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full sm:w-auto dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700" disabled={isUpdating}>
                    Zavrieť
                </Button>
            </DialogClose>
            {/* Akčné tlačidlá pre zmenu statusu - teraz v `grid` pre lepšie usporiadanie na mobiloch */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full sm:w-auto">
                {renderActionButton(StudyBlockStatus.COMPLETED, block.status, "Dokončené", CheckCircle2, "default")}
                {renderActionButton(StudyBlockStatus.IN_PROGRESS, block.status, "Začať", Zap, "outline")}
                {renderActionButton(StudyBlockStatus.PLANNED, block.status, "Naplánovať", Hourglass, "outline")}
                {renderActionButton(StudyBlockStatus.SKIPPED, block.status, "Preskočiť", XCircle, "destructive")}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}