"use client";

import { useEffect, useState } from "react";
import type { StudyBlock } from "@/services/studyPlanService";
import { StudyBlockStatus } from "@/types/study";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  Zap,
  XCircle,
  BookOpen,
  Target,
  FileText,
} from "lucide-react";

/* ✨ shadcn komponenty pre date & time */
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "../ui/time-picker";
const formatEnumValue = (val?: string | null) =>
  val ? val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

const getStatusConfig = (status: StudyBlockStatus) => {
  switch (status) {
    case StudyBlockStatus.COMPLETED:
      return {
        variant: "default" as const,
        className: "bg-green-500 border-green-500 hover:bg-green-600 text-white",
        icon: CheckCircle2,
        color: "text-green-600 dark:text-green-400",
      };
    case StudyBlockStatus.IN_PROGRESS:
      return {
        variant: "secondary" as const,
        className: "bg-blue-500 border-blue-500 hover:bg-blue-600 text-white",
        icon: Zap,
        color: "text-blue-600 dark:text-blue-400",
      };
    case StudyBlockStatus.SKIPPED:
      return {
        variant: "destructive" as const,
        className: "bg-red-500 border-red-500 hover:bg-red-600 text-white",
        icon: XCircle,
        color: "text-red-600 dark:text-red-400",
      };
    default:
      return {
        variant: "outline" as const,
        className: "border-muted-foreground/20 text-muted-foreground",
        icon: Clock,
        color: "text-muted-foreground",
      };
  }
};

/* ---------- Props ---------- */
interface StudyBlockDetailDialogProps {
  block: StudyBlock | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateStatus: (blockId: number, newStatus: StudyBlockStatus) => Promise<void>;
  onUpdateNotes?: (blockId: number, notes: string) => Promise<void>;
  /* ✨ nový callback na zmenu dátumu/času */
  onUpdateSchedule?: (blockId: number, newStart: Date) => Promise<void>;
  isUpdating: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */
export default function StudyBlockDetailDialog({
  block,
  isOpen,
  onOpenChange,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateSchedule,
  isUpdating,
}: StudyBlockDetailDialogProps) {
  const [currentNotes, setCurrentNotes] = useState("");
  const [tempStart, setTempStart] = useState<Date | null>(null);

  /* ---------- Sync lokálneho stavu pri otvorení ---------- */
  useEffect(() => {
    if (isOpen && block) {
      setCurrentNotes(block.notes || "");
      setTempStart(block.scheduled_at ? new Date(block.scheduled_at) : null);
    }
  }, [isOpen, block]);

  if (!block) return null;

  const statusCfg = getStatusConfig(block.status);
  const StatusIcon = statusCfg.icon;

  /* ---------- Uloženie poznámok ---------- */
  const handleNotesSave = async () => {
    if (
      onUpdateNotes &&
      currentNotes.trim() !== (block.notes || "").trim()
    ) {
      await onUpdateNotes(block.id, currentNotes.trim());
    }
  };

  /* ---------- Uloženie dátumu/času ---------- */
  const handleScheduleSave = async () => {
    if (onUpdateSchedule && tempStart) {
      await onUpdateSchedule(block.id, tempStart);
    }
  };

  /* ---------- Render pomocného tlačidla pre status ---------- */
  const renderActionButton = (
    targetStatus: StudyBlockStatus,
    text: string,
    Icon: React.ElementType
  ) => {
    if (
      targetStatus === block.status && targetStatus !== StudyBlockStatus.PLANNED
    )
      return null;
    if (
      block.status === StudyBlockStatus.COMPLETED &&
      targetStatus !== StudyBlockStatus.PLANNED
    )
      return null;
    if (
      block.status === StudyBlockStatus.SKIPPED &&
      targetStatus === StudyBlockStatus.IN_PROGRESS
    )
      return null;

    const cfg = getStatusConfig(targetStatus);
    return (
      <Button
        className={`w-full ${cfg.className}`}
        variant={cfg.variant}
        size="sm"
        onClick={async () => {
          await onUpdateStatus(block.id, targetStatus);
          if (isOpen && targetStatus === StudyBlockStatus.COMPLETED)
            onOpenChange(false);
        }}
        disabled={isUpdating}
      >
        {isUpdating && targetStatus === block.status && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        <Icon className="mr-2 h-4 w-4" />
        {text}
      </Button>
    );
  };

  /* ---------------------------------------------------------------------- */
  /*                                 JSX                                    */
  /* ---------------------------------------------------------------------- */
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ----------------------- Hlavička ----------------------- */}
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold leading-tight">
                Detail Študijného Bloku
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span className="break-words">
                  Téma:{" "}
                  <strong className="text-primary">{block.topic.name}</strong>
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* ----------------- Status + základné info ----------------- */}
          <Card className="border-muted/40">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Status
                </span>
                <Badge
                  variant={statusCfg.variant}
                  className={`${statusCfg.className} flex items-center gap-1`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {formatEnumValue(block.status)}
                </Badge>
              </div>

              {/* --------- Dátum/čas naplánovania --------- */}
              {block.scheduled_at && (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                    <span>Naplánované</span>
                  </div>
                  <div className="text-sm font-medium text-right">
                    {new Date(block.scheduled_at).toLocaleString("sk-SK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              )}

              {/* --------- Trvanie --------- */}
              {block.duration_minutes != null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Trvanie</span>
                  </div>
                  <span className="text-sm font-medium">
                    {block.duration_minutes} minút
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ----------------- Úprava dátumu/času ----------------- */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Naplánované na
            </label>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {tempStart
                    ? tempStart.toLocaleString("sk-SK", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Vyber dátum a čas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <Calendar
                  mode="single"
                  selected={tempStart ?? undefined}
                  onSelect={(date) => setTempStart(date ?? null)}
                />
                <TimePicker
                  value={tempStart ?? undefined}
                  onChange={setTempStart}
                  className="mt-2"
                />
              </PopoverContent>
            </Popover>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleScheduleSave}
              disabled={!tempStart || isUpdating}
              className="mt-2"
            >
              {isUpdating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Uložiť Dátum/Čas
            </Button>
          </div>

          {/* ----------------- Poznámky ----------------- */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <label
                htmlFor={`blockNotes-${block.id}`}
                className="text-sm font-medium"
              >
                Vaše poznámky
              </label>
            </div>
            <Textarea
              id={`blockNotes-${block.id}`}
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              placeholder="Pridajte si poznámky, dôležité body alebo otázky..."
              rows={4}
              disabled={isUpdating}
              className="resize-y min-h-[80px]"
            />
            {onUpdateNotes && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleNotesSave}
                  disabled={
                    isUpdating ||
                    currentNotes.trim() === (block.notes || "").trim()
                  }
                >
                  {isUpdating &&
                    currentNotes !== (block.notes || "") && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                  {currentNotes.trim() === (block.notes || "").trim()
                    ? "Poznámky Uložené"
                    : "Uložiť Poznámky"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ----------------- Footer (akcie) ----------------- */}
        <Separator className="my-6" />

        <DialogFooter className="flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:space-x-3">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isUpdating}
            >
              Zavrieť
            </Button>
          </DialogClose>

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:gap-2">
            {renderActionButton(StudyBlockStatus.COMPLETED, "Dokončené", CheckCircle2)}
            {renderActionButton(StudyBlockStatus.IN_PROGRESS, "Začať", Zap)}
            {renderActionButton(StudyBlockStatus.PLANNED, "Naplánovať", Clock)}
            {renderActionButton(StudyBlockStatus.SKIPPED, "Preskočiť", XCircle)}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
