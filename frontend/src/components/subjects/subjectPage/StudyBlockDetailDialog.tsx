"use client";

import { useEffect, useState, useContext } from "react";
import type { StudyBlock } from "@/services/studyPlanService";
import { StudyBlockStatus } from "@/types/study";
import { getStudyMaterialsForSubject, StudyMaterial } from "@/services/studyMaterialService";
import { AuthContext } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { 
    CheckCircle2, Loader2, Zap, XCircle, 
    BookOpen, Target,
} from "lucide-react";

const formatEnumValue = (val?: string | null) =>
  val ? val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "N/A";

const getAiDifficultyLabelAndColor = (score: number | null | undefined): { label: string, colorClass: string } => {
    if (score === null || score === undefined) return { label: "Neznáma", colorClass: "text-muted-foreground" };
    if (score <= 0.2) return { label: "Veľmi ľahká", colorClass: "text-green-600 dark:text-green-400" };
    if (score <= 0.4) return { label: "Ľahká", colorClass: "text-lime-600 dark:text-lime-400" };
    if (score <= 0.6) return { label: "Stredná", colorClass: "text-yellow-600 dark:text-yellow-500" };
    if (score <= 0.8) return { label: "Ťažká", colorClass: "text-orange-600 dark:text-orange-400" };
    return { label: "Veľmi ťažká", colorClass: "text-red-600 dark:text-red-500" };
};

interface StudyBlockDetailDialogProps {
  block: StudyBlock | null;
  subjectName?: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateStatus: (blockId: number, newStatus: StudyBlockStatus) => Promise<void>;
  onUpdateNotes: (blockId: number, notes: string | null) => Promise<void>;
  onUpdateSchedule: (blockId: number, newStart: Date, newEnd?: Date) => Promise<void>;
  onAssignMaterial: (blockId: number, materialId: number | null) => Promise<void>;
  onGenerateQuestions: (topicId: number) => Promise<unknown[]>; // Predpokladáme, že vracia pole otázok
  isUpdating: boolean;
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
  const authContext = useContext(AuthContext);
  const [currentNotes, setCurrentNotes] = useState("");
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [subjectMaterials, setSubjectMaterials] = useState<StudyMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("none");
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  useEffect(() => {
    if (isOpen && block) {
      setCurrentNotes(block.notes || "");
      setTempStart(block.scheduled_at ? new Date(block.scheduled_at) : null);
      setSelectedMaterialId(block.material_id ? String(block.material_id) : "none");

      if (block.subject_id && authContext?.token) {
        setIsLoadingMaterials(true);
        getStudyMaterialsForSubject(block.subject_id, authContext.token)
          .then((data) => setSubjectMaterials(data))
          .catch(() => setSubjectMaterials([]))
          .finally(() => setIsLoadingMaterials(false));
      }
    } else {
      setSubjectMaterials([]);
    }
  }, [isOpen, block, authContext?.token]);

  if (!block) return null;

  const handleNotesSave = async () => {
    const notesToSave = currentNotes.trim() === "" ? null : currentNotes.trim();
    if (notesToSave !== (block.notes || null)) {
       await onUpdateNotes(block.id, notesToSave);
    }
  };

  const handleScheduleSave = async () => {
    if (tempStart) {
      const originalTime = block.scheduled_at ? new Date(block.scheduled_at).getTime() : null;
      if (originalTime !== tempStart.getTime()) {
        await onUpdateSchedule(block.id, tempStart);
      }
    }
  };

  const handleAssignMaterial = async () => {
    const materialIdToSave = selectedMaterialId === "none" ? null : Number(selectedMaterialId);
    if (materialIdToSave !== (block.material_id ?? null)) {
      await onAssignMaterial(block.id, materialIdToSave);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-card">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
          <div className="flex gap-4 items-center">
            <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
              <Target className="h-7 w-7" />
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent leading-tight">
                Detail Študijného Bloku
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-base text-muted-foreground truncate">
                <BookOpen className="h-4 w-4" />
                <span>Téma: <strong>{block.topic.name}</strong></span>
              </DialogDescription>
              {subjectName && <DialogDescription className="text-sm text-muted-foreground">Predmet: {subjectName}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Základné Informácie</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Status:</span><Badge variant={block.status === "completed" ? "default" : "secondary"} className={`${block.status === "completed" ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{formatEnumValue(block.status)}</Badge></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Dĺžka:</span><span className="font-medium">{block.duration_minutes ?? 'N/A'} minút</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">AI Náročnosť:</span><span className={`font-medium ${getAiDifficultyLabelAndColor(block.topic.ai_difficulty_score).colorClass}`}>{getAiDifficultyLabelAndColor(block.topic.ai_difficulty_score).label}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">AI Čas:</span><span className="font-medium">{block.topic.ai_estimated_duration ?? 'N/A'} minút</span></div>
              </div>
            </div>

            <Separator />

            <div>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Plánovanie</h3>
                <div className="space-y-2">
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal">{tempStart ? tempStart.toLocaleString("sk-SK", {dateStyle: "medium", timeStyle: "short"}) : <span>Vyberte dátum a čas</span>}</Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={tempStart ?? undefined} onSelect={(date) => setTempStart(date ? new Date(date.setHours(tempStart?.getHours() ?? 0, tempStart?.getMinutes() ?? 0)) : null)} initialFocus /><div className="p-3 border-t border-border"><TimePicker date={tempStart} setDate={setTempStart} /></div></PopoverContent>
                    </Popover>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleScheduleSave}
                      disabled={
                        Boolean(isUpdating) ||
                        Boolean(
                          block.scheduled_at &&
                          tempStart &&
                          new Date(block.scheduled_at).getTime() === tempStart.getTime()
                        )
                      }
                    >
                        {isUpdating && (block.scheduled_at && tempStart && new Date(block.scheduled_at).getTime() !== tempStart.getTime()) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Uložiť Plán
                    </Button>
                </div>
            </div>

            <Separator />
            
            <div>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Študijný Materiál</h3>
                <div className="space-y-2">
                    {isLoadingMaterials ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Načítavam...</span></div>
                    ) : subjectMaterials.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Pre tento predmet nie sú nahrané žiadne materiály.</p>
                    ) : (
                    <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId} disabled={isUpdating}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Vyberte materiál..." /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="none">Žiadny</SelectItem>
                        {subjectMaterials.map((mat) => (<SelectItem key={mat.id} value={String(mat.id)}>{mat.title || mat.file_name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    )}
                    {(subjectMaterials.length > 0 || selectedMaterialId !== "none") && (
                    <Button size="sm" variant="secondary" onClick={handleAssignMaterial} disabled={isUpdating || selectedMaterialId === (block.material_id ? String(block.material_id) : "none")}>
                        {isUpdating && selectedMaterialId !== (block.material_id ? String(block.material_id) : "none") && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Uložiť Materiál
                    </Button>
                    )}
                </div>
            </div>

            {/* TODO: Placeholder pre generovanie otázok */}
            {/* <Separator />
            <div>
              <Button variant="outline" className="w-full" onClick={() => onGenerateQuestions(block.topic.id)}>
                <Sparkles className="mr-2 h-4 w-4" /> Vygenerovať Cvičné Otázky
              </Button>
            </div> */}

          </div>

          <div className="lg:col-span-2 space-y-3 flex flex-col">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-1">Poznámky k Bloku</h3>
            <Textarea
              id={`blockNotes-${block.id}`}
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Zapíšte si dôležité body, otázky alebo myšlienky..."
              rows={10}
              disabled={isUpdating}
              className="resize-y flex-grow text-base"
            />
            <div className="flex justify-end">
              <Button size="sm" variant="secondary" onClick={handleNotesSave} disabled={isUpdating || currentNotes.trim() === (block.notes || "").trim()}>
                {isUpdating && currentNotes.trim() !== (block.notes || "").trim() && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentNotes.trim() === (block.notes || "").trim() ? "Poznámky Uložené" : "Uložiť Poznámky"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/30 border-t flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isUpdating}>
              Zavrieť
            </Button>
          </DialogClose>
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:gap-2">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={isUpdating || block.status === StudyBlockStatus.COMPLETED} onClick={() => onUpdateStatus(block.id, StudyBlockStatus.COMPLETED)}><CheckCircle2 className="mr-2 h-4 w-4" />Dokončené</Button>
            <Button size="sm" variant="secondary" disabled={isUpdating || block.status === StudyBlockStatus.IN_PROGRESS || block.status === StudyBlockStatus.COMPLETED} onClick={() => onUpdateStatus(block.id, StudyBlockStatus.IN_PROGRESS)}><Zap className="mr-2 h-4 w-4" />Začať</Button>
            <Button size="sm" variant="destructive" disabled={isUpdating || block.status === StudyBlockStatus.SKIPPED || block.status === StudyBlockStatus.COMPLETED} onClick={() => onUpdateStatus(block.id, StudyBlockStatus.SKIPPED)}><XCircle className="mr-2 h-4 w-4" />Preskočiť</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}