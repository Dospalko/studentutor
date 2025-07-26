"use client"

import { useEffect } from "react"
import type { StudyBlock } from "@/services/studyPlanService"
import { StudyBlockStatus } from "@/types/study"

// Importy pre sub-komponenty
import BlockStatusInfo from "../dialogBlocks/BlockStatusInfo"
import BlockScheduleEditor from "../dialogBlocks/BlockScheduleEditor"
import BlockNotesEditor from "../dialogBlocks/BlockNotesEditor"
import BlockActionButtons from "../dialogBlocks/BlockActionButtons"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Target, Clock, Calendar, FileText, CheckCircle2, AlertCircle, Pause, Play } from "lucide-react"

interface StudyBlockDetailDialogProps {
  block: StudyBlock | null
  subjectName?: string
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onUpdateStatus: (blockId: number, newStatus: StudyBlockStatus) => Promise<void>
  onUpdateNotes: (blockId: number, notes: string | null) => Promise<void>
  onUpdateSchedule: (blockId: number, newStart: Date, newEnd?: Date) => Promise<void>
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
}: StudyBlockDetailDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      // Reset logiky tu nie je nutný, ak sub-komponenty reagujú na zmenu `block` propu
    }
  }, [isOpen])

  if (!block) return null

  const getStatusIcon = (status: StudyBlockStatus) => {
    switch (status) {
      case StudyBlockStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case StudyBlockStatus.IN_PROGRESS:
        return <Play className="h-4 w-4 text-blue-600" />
      case StudyBlockStatus.SKIPPED:
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Pause className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: StudyBlockStatus) => {
    switch (status) {
      case StudyBlockStatus.COMPLETED:
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300"
      case StudyBlockStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
      case StudyBlockStatus.SKIPPED:
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 space-y-4 border-b border-muted/40">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary flex-shrink-0">
              <Target className="h-6 w-6" />
            </div>

            {/* Title & Info */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <DialogTitle className="text-2xl font-bold leading-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Detail Študijného Bloku
                </DialogTitle>

                <DialogDescription className="flex items-center gap-2 mt-2 text-base">
                  <BookOpen className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="break-words">
                    Téma: <strong className="text-foreground font-semibold">{block.topic.name}</strong>
                  </span>
                </DialogDescription>

                {subjectName && (
                  <DialogDescription className="text-sm mt-1 text-muted-foreground">
                    Predmet: {subjectName}
                  </DialogDescription>
                )}
              </div>

              {/* Quick Info Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`flex items-center gap-1 ${getStatusColor(block.status)}`}>
                  {getStatusIcon(block.status)}
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">{getStatusIcon(block.status)}</div>
              Stav bloku
            </h3>
            <BlockStatusInfo block={block} />
          </div>

          <Separator className="my-6" />

          {/* Schedule Editor */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                <Calendar className="h-4 w-4" />
              </div>
              Plánovanie
            </h3>
            <BlockScheduleEditor
              initialScheduledAt={block.scheduled_at}
              onSaveSchedule={(newDate) => onUpdateSchedule(block.id, newDate)}
              isUpdating={isUpdating}
            />
          </div>

          <Separator className="my-6" />

          {/* Notes Editor */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30">
                <FileText className="h-4 w-4" />
              </div>
              Poznámky
            </h3>
            <BlockNotesEditor
              blockId={block.id}
              initialNotes={block.notes}
              onSaveNotes={(notes) => onUpdateNotes(block.id, notes)}
              isUpdating={isUpdating}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-muted/40 bg-muted/20">
          <DialogFooter className="p-6 flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:space-x-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto bg-transparent" disabled={isUpdating}>
                Zavrieť
              </Button>
            </DialogClose>

            <BlockActionButtons
              currentStatus={block.status}
              blockId={block.id}
              onUpdateStatus={onUpdateStatus}
              isUpdating={isUpdating}
              onDialogClose={() => onOpenChange(false)}
            />
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
