"use client";

import { useEffect, useState } from "react";
import type { Topic, TopicCreate, TopicUpdate } from "@/services/topicService";
import TopicList from "@/components/subjects/TopicList";
import TopicFormDialog from "@/components/subjects/TopicFormDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface TopicsSectionDisplayProps {
  subjectId: number | undefined;
  subjectName: string | undefined;
  initialTopics: Topic[];
  onTopicCreate: (data: TopicCreate) => Promise<Topic | void>;
  onTopicUpdate: (id: number, data: TopicUpdate) => Promise<Topic | void>;
  onTopicDelete: (id: number) => Promise<void>;
}

export default function TopicsSectionDisplay({
  subjectId,
  subjectName,
  initialTopics,
  onTopicCreate,
  onTopicUpdate,
  onTopicDelete,
}: TopicsSectionDisplayProps) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);

  useEffect(() => {
    setTopics(initialTopics.sort((a, b) => a.name.localeCompare(b.name)));
  }, [initialTopics]);

  const handleOpenNewTopicDialog = () => {
    setEditingTopic(null);
    setTopicError(null);
    setIsTopicDialogOpen(true);
  };

  const handleOpenEditTopicDialog = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicError(null);
    setIsTopicDialogOpen(true);
  };

  const handleSubmitTopic = async (data: TopicCreate | TopicUpdate, editingTopicId?: number) => {
    if (!subjectId) return;
    setIsSubmittingTopic(true);
    setTopicError(null);
    try {
      if (editingTopicId && editingTopic) {
        const updated = await onTopicUpdate(editingTopicId, data as TopicUpdate);
        if (updated) setTopics(prev => prev.map(t => t.id === updated.id ? updated : t).sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const created = await onTopicCreate(data as TopicCreate);
        if (created) setTopics(prev => [created, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setIsTopicDialogOpen(false);
    } catch (err) {
      setTopicError(err instanceof Error ? err.message : "Chyba pri ukladaní témy.");
    } finally {
      setIsSubmittingTopic(false);
    }
  };
  
  const handleDeleteTopic = async (topicId: number) => {
    if (!window.confirm('Naozaj chcete zmazať túto tému?')) return;
    setTopicError(null);
    try {
      await onTopicDelete(topicId);
      setTopics(prev => prev.filter(t => t.id !== topicId));
    } catch (err) {
      setTopicError(err instanceof Error ? err.message : "Nepodarilo sa zmazať tému.");
    }
  }

  return (
    <>
      {topicError && (
          <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Chyba Témy</AlertTitle>
              <AlertDescription>{topicError}</AlertDescription>
          </Alert>
      )}
      <TopicList
        topics={topics}
        onEditTopic={handleOpenEditTopicDialog}
        onDeleteTopic={handleDeleteTopic}
        onOpenNewTopicDialog={handleOpenNewTopicDialog}
      />
      <TopicFormDialog
        isOpen={isTopicDialogOpen}
        onOpenChange={setIsTopicDialogOpen}
        editingTopic={editingTopic}
        subjectName={subjectName}
        onSubmit={handleSubmitTopic}
        isSubmitting={isSubmittingTopic}
      />
    </>
  );
}