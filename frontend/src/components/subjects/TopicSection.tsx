"use client"

import type { Topic, TopicCreate, TopicUpdate } from "@/services/topicService"
import TopicList from "./TopicList"
import TopicFormDialog from "./TopicFormDialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface TopicSectionProps {
  topics: Topic[]
  subjectName: string | undefined
  error: string | null

  isDialogOpen: boolean
  editingTopic: Topic | null
  isSubmitting: boolean

  onOpenChangeDialog: (isOpen: boolean) => void
  onOpenNewDialog: () => void
  onOpenEditDialog: (topic: Topic) => void
  onSubmitForm: (data: TopicCreate | TopicUpdate, editingTopicId?: number) => Promise<void>
  onDeleteTopic: (topicId: number) => void
}

export default function TopicSection({
  topics,
  subjectName,
  error,
  isDialogOpen,
  editingTopic,
  isSubmitting,
  onOpenChangeDialog,
  onOpenNewDialog,
  onOpenEditDialog,
  onSubmitForm,
  onDeleteTopic,
}: TopicSectionProps) {
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6 border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chyba Operácie s Témou</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <TopicList
        topics={topics}
        onEditTopic={onOpenEditDialog}
        onDeleteTopic={onDeleteTopic}
        onOpenNewTopicDialog={onOpenNewDialog}
      />
      <TopicFormDialog
        isOpen={isDialogOpen}
        onOpenChange={onOpenChangeDialog}
        editingTopic={editingTopic}
        subjectName={subjectName}
        onSubmit={onSubmitForm}
        isSubmitting={isSubmitting}
      />
    </>
  )
}
