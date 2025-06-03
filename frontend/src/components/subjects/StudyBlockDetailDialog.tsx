"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { StudyBlock } from "@/services/studyPlanService"
import { StudyBlockStatus } from "@/types/study"
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
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, CheckCircle2, Clock, Loader2, Zap, XCircle, BookOpen, Target, FileText } from "lucide-react"

const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return ""
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

const getStatusConfig = (status: StudyBlockStatus) => {
  switch (status) {
    case StudyBlockStatus.COMPLETED:
      return {
        variant: "default" as const,
        className: "bg-green-500 border-green-500 hover:bg-green-600 text-white",
        icon: CheckCircle2,
        color: "text-green-600 dark:text-green-400",
      }
    case StudyBlockStatus.IN_PROGRESS:
      return {
        variant: "secondary" as const,
        className: "bg-blue-500 border-blue-500 hover:bg-blue-600 text-white",
        icon: Zap,
        color: "text-blue-600 dark:text-blue-400",
      }
    case StudyBlockStatus.SKIPPED:
      return {
        variant: "destructive" as const,
        className: "bg-red-500 border-red-500 hover:bg-red-600 text-white",
        icon: XCircle,
        color: "text-red-600 dark:text-red-400",
      }
    default:
      return {
        variant: "outline" as const,
        className: "border-muted-foreground/20 text-muted-foreground",
        icon: Clock,
        color: "text-muted-foreground",
      }
  }
}

interface StudyBlockDetailDialogProps {
  block: StudyBlock | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onUpdateStatus: (blockId: number, newStatus: StudyBlockStatus) => Promise<void>
  onUpdateNotes?: (blockId: number, notes: string) => Promise<void>
  isUpdating: boolean
}

export default function StudyBlockDetailDialog({
  block,
  isOpen,
  onOpenChange,
  onUpdateStatus,
  onUpdateNotes,
  isUpdating,
}: StudyBlockDetailDialogProps) {
  const [currentNotes, setCurrentNotes] = useState<string>("")

  useEffect(() => {
    if (isOpen && block) {
      setCurrentNotes(block.notes || "")
    }
  }, [isOpen, block])

  if (!block) return null

  const statusConfig = getStatusConfig(block.status)
  const StatusIcon = statusConfig.icon

  const handleNotesSave = async () => {
    if (onUpdateNotes && currentNotes.trim() !== (block.notes || "").trim()) {
      await onUpdateNotes(block.id, currentNotes.trim())
    }
  }

  const hasNotesChanged = onUpdateNotes && currentNotes.trim() !== (block.notes || "").trim()

  const renderActionButton = (
    targetStatus: StudyBlockStatus,
    currentStatus: StudyBlockStatus,
    text: string,
    Icon: React.ElementType,
  ) => {
    if (targetStatus === currentStatus && targetStatus !== StudyBlockStatus.PLANNED) return null
    if (currentStatus === StudyBlockStatus.COMPLETED && targetStatus !== StudyBlockStatus.PLANNED) return null
    if (currentStatus === StudyBlockStatus.SKIPPED && targetStatus === StudyBlockStatus.IN_PROGRESS) return null

    const config = getStatusConfig(targetStatus)

    return (
      <Button
        className={`w-full ${config.className}`}
        variant={config.variant}
        size="sm"
        onClick={async () => {
          await onUpdateStatus(block.id, targetStatus)
          if (isOpen && targetStatus === StudyBlockStatus.COMPLETED) onOpenChange(false)
        }}
        disabled={isUpdating}
      >
        {isUpdating && targetStatus === block.status && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Icon className="mr-2 h-4 w-4" />
        {text}
      </Button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold leading-tight">Detail Študijného Bloku</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span className="break-words">
                  Téma: <strong className="text-primary">{block.topic.name}</strong>
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <Card className="border-muted/40">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <Badge variant={statusConfig.variant} className={`${statusConfig.className} flex items-center gap-1`}>
                  <StatusIcon className="h-3 w-3" />
                  {formatEnumValue(block.status)}
                </Badge>
              </div>

              {block.scheduled_at && (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
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

              {block.duration_minutes !== null && block.duration_minutes !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Trvanie</span>
                  </div>
                  <span className="text-sm font-medium">{block.duration_minutes} minút</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <label htmlFor={`blockNotes-${block.id}`} className="text-sm font-medium">
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
                  disabled={isUpdating || !hasNotesChanged}
                >
                  {isUpdating && currentNotes !== (block.notes || "") && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {hasNotesChanged ? "Uložiť Poznámky" : "Poznámky Uložené"}
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        <DialogFooter className="flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:space-x-3">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isUpdating}>
              Zavrieť
            </Button>
          </DialogClose>

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:gap-2">
            {renderActionButton(StudyBlockStatus.COMPLETED, block.status, "Dokončené", CheckCircle2)}
            {renderActionButton(StudyBlockStatus.IN_PROGRESS, block.status, "Začať", Zap)}
            {renderActionButton(StudyBlockStatus.PLANNED, block.status, "Naplánovať", Clock)}
            {renderActionButton(StudyBlockStatus.SKIPPED, block.status, "Preskočiť", XCircle)}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}