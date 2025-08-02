"use client"

import { useEffect } from "react"
import type { StudyBlock } from "@/services/studyPlanService"
import { StudyBlockStatus } from "@/types/study"
import BlockStatusInfo from "../dialogBlocks/BlockStatusInfo"
import BlockScheduleEditor from "../dialogBlocks/BlockScheduleEditor"
import BlockNotesEditor from "../dialogBlocks/BlockNotesEditor"
import BlockActionButtons from "../dialogBlocks/BlockActionButtons"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Target, Clock, Calendar, FileText, CheckCircle2, AlertCircle, PauseCircle, PlayCircle } from "lucide-react"

interface Props {
  block: StudyBlock | null
  subjectName?: string
  isOpen: boolean
  onOpenChange: (v: boolean) => void
  onUpdateStatus: (id: number, s: StudyBlockStatus) => Promise<void>
  onUpdateNotes: (id: number, n: string | null) => Promise<void>
  onUpdateSchedule: (id: number, start: Date) => Promise<void>
  isUpdating: boolean
}

export default function StudyBlockDetailDialog({
  block,
  subjectName,
  isOpen,
  onOpenChange,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateSchedule,
  isUpdating,
}: Props) {
  useEffect(() => {}, [isOpen])

  if (!block) return null

  const statusIcon = {
    [StudyBlockStatus.COMPLETED]: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    [StudyBlockStatus.IN_PROGRESS]: <PlayCircle className="h-4 w-4 text-sky-600" />,
    [StudyBlockStatus.SKIPPED]: <AlertCircle className="h-4 w-4 text-rose-600" />,
    [StudyBlockStatus.PLANNED]: <PauseCircle className="h-4 w-4 text-muted-foreground" />,
  }[block.status]

  const statusStyle = {
    [StudyBlockStatus.COMPLETED]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    [StudyBlockStatus.IN_PROGRESS]: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    [StudyBlockStatus.SKIPPED]: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    [StudyBlockStatus.PLANNED]: "bg-muted text-muted-foreground dark:bg-muted/20",
  }[block.status]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-card">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-3">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Detail študijného bloku
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Téma: <strong>{block.topic.name}</strong></span>
              </DialogDescription>
              {subjectName && (
                <DialogDescription className="text-sm">{subjectName}</DialogDescription>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`flex items-center gap-1 ${statusStyle}`}>
                  {statusIcon}
                  <span className="capitalize">{block.status.replace(/_/g, " ").toLowerCase()}</span>
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {block.duration_minutes ?? 60} min
                </Badge>
                {block.scheduled_at && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(block.scheduled_at).toLocaleDateString("sk-SK")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">{statusIcon}</div>
              Stav
            </h3>
            <BlockStatusInfo block={block} />
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-600">
                <Calendar className="h-4 w-4" />
              </div>
              Plánovanie
            </h3>
            <BlockScheduleEditor
              initialScheduledAt={block.scheduled_at}
              onSaveSchedule={(d) => onUpdateSchedule(block.id, d)}
              isUpdating={isUpdating}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                <FileText className="h-4 w-4" />
              </div>
              Poznámky
            </h3>
            <BlockNotesEditor
              blockId={block.id}
              initialNotes={block.notes}
              onSaveNotes={(n) => onUpdateNotes(block.id, n)}
              isUpdating={isUpdating}
            />
          </div>
        </div>

        <div className="border-t bg-muted/30">
          <DialogFooter className="p-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
            <BlockActionButtons
              currentStatus={block.status}
              blockId={block.id}
              onUpdateStatus={onUpdateStatus}
              isUpdating={isUpdating}
              onDialogClose={() => onOpenChange(false)}
            />
            <DialogClose asChild>
              <Button variant="outline" disabled={isUpdating}>
                Zavrieť
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
