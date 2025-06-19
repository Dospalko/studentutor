"use client";

import { FC, useState } from "react";
import TopicList from "./TopicList";
import TopicFormDialog from "./TopicFormDialog";

import { Topic, TopicCreate, TopicUpdate } from "@/services/topicService";
import { useAuth } from "@/hooks/useAuth";
import { getTopicsForSubject } from "@/services/topicService"; // ak potrebuješ refetch

interface Props {
  subjectId: number; // pridáme kvôli refetch
  topics: Topic[];
  upsertTopic: (d: TopicCreate | TopicUpdate, id?: number) => Promise<void>;
  removeTopic: (id: number) => Promise<void>;
  subjectName?: string;
}

const TopicsSection: FC<Props> = ({
  subjectId,
  topics: initial,
  upsertTopic,
  removeTopic,
  subjectName,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [topics, setTopics] = useState<Topic[]>(initial);

  const { token } = useAuth();

  // lokálne nahradí / pridá tému po AI analýze
  const handleTopicUpdate = (t: Topic) =>
    setTopics((prev) => prev.map((p) => (p.id === t.id ? t : p)));

  const handleSubmit = async (d: TopicCreate | TopicUpdate) => {
    setSubmitting(true);
    await upsertTopic(d, editing?.id);
    setSubmitting(false);
    setDialogOpen(false);

    // refetch celé pole (aby malo ai_* aj pre nové témy)
    if (token) {
      const fresh = await getTopicsForSubject(subjectId, token);
      setTopics(fresh);
    }
  };

  const handleDelete = async (id: number) => {
    await removeTopic(id);
    setTopics((p) => p.filter((t) => t.id !== id));
  };

  return (
    <>
      <TopicList
        topics={topics}
        onEditTopic={(t) => {
          setEditing(t);
          setDialogOpen(true);
        }}
        onDeleteTopic={handleDelete}
        onOpenNewTopicDialog={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        onTopicUpdate={handleTopicUpdate}
      />

      <TopicFormDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        editingTopic={editing}
        subjectName={subjectName}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />
    </>
  );
};

export default TopicsSection;
