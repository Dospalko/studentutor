// frontend/src/components/subjects/details/TopicsSection.tsx
"use client";

import { useState } from "react";
import { Topic, TopicCreate, TopicUpdate } from "@/services/topicService";
import TopicList from "@/components/subjects/TopicList"; // Predpokladáme, že tento existuje
import TopicFormDialog from "@/components/subjects/TopicFormDialog"; // Predpokladáme, že tento existuje

interface TopicsSectionProps {
  subjectId: number | undefined; // ID aktuálneho predmetu
  subjectName: string | undefined;
  topics: Topic[];
  onTopicsUpdate: (updatedTopics: Topic[]) => void; // Callback na aktualizáciu zoznamu tém v rodičovi
  // API volania zostanú v rodičovi, tento komponent len manažuje UI pre dialóg
  handleTopicCreate: (data: TopicCreate) => Promise<Topic | void>;
  handleTopicUpdate: (id: number, data: TopicUpdate) => Promise<Topic | void>;
  handleTopicDelete: (id: number) => Promise<void>;
}

export default function TopicsSection({
  subjectId,
  subjectName,
  topics,
  onTopicsUpdate,
  handleTopicCreate,
  handleTopicUpdate,
  handleTopicDelete,
}: TopicsSectionProps) {
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);
  const [, setTopicFormError] = useState<string | null>(null);


  const openNewTopicDialog = () => {
    setEditingTopic(null);
    setTopicFormError(null);
    setIsTopicDialogOpen(true);
  };

  const openEditTopicDialog = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicFormError(null);
    setIsTopicDialogOpen(true);
  };

  const submitTopicForm = async (data: TopicCreate | TopicUpdate, editingTopicId?: number) => {
    if (!subjectId) return;
    setIsSubmittingTopic(true);
    setTopicFormError(null);
    try {
      let newTopicsList;
      if (editingTopicId && editingTopic) {
        const updated = await handleTopicUpdate(editingTopicId, data as TopicUpdate);
        if (updated) {
          newTopicsList = topics.map(t => t.id === updated.id ? updated : t);
        } else {
          newTopicsList = [...topics]; // Ak update zlyhal alebo nevrátil nič
        }
      } else {
        const created = await handleTopicCreate(data as TopicCreate);
        if (created) {
          newTopicsList = [created, ...topics];
        } else {
          newTopicsList = [...topics];
        }
      }
      onTopicsUpdate(newTopicsList.sort((a, b) => a.name.localeCompare(b.name)));
      setIsTopicDialogOpen(false);
    } catch (err) {
      setTopicFormError(err instanceof Error ? err.message : "Chyba pri ukladaní témy.");
    } finally {
      setIsSubmittingTopic(false);
    }
  };
  
  const deleteTopicHandler = async (topicId: number) => {
      if (!window.confirm('Naozaj chcete zmazať túto tému?')) return;
      try {
        await handleTopicDelete(topicId);
        onTopicsUpdate(topics.filter(t => t.id !== topicId));
      } catch (err) {
        setTopicFormError(err instanceof Error ? err.message : "Nepodarilo sa zmazať tému.");
      }
  }

  return (
    <>
      <TopicList
        topics={topics}
        onEditTopic={openEditTopicDialog}
        onDeleteTopic={deleteTopicHandler}
        onOpenNewTopicDialog={openNewTopicDialog}
      />
      <TopicFormDialog
        isOpen={isTopicDialogOpen}
        onOpenChange={setIsTopicDialogOpen}
        editingTopic={editingTopic}
        subjectName={subjectName}
        onSubmit={submitTopicForm}
        isSubmitting={isSubmittingTopic}
        // Ak TopicFormDialog zobrazuje vlastnú chybu, nepotrebuješ ju posielať
        // formError={topicFormError}
      />
    </>
  );
}