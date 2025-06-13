// src/components/subjects/TopicsSection.tsx
"use client";
import { FC, useState } from "react";
import TopicList from "@/components/subjects/TopicList";
import TopicFormDialog from "@/components/subjects/TopicFormDialog";
import { Topic, TopicCreate, TopicUpdate } from "@/services/topicService";

interface Props {
  topics: Topic[];
  upsertTopic: (d: TopicCreate | TopicUpdate, id?: number) => Promise<void>;
  removeTopic: (id: number) => Promise<void>;
  subjectName?: string;
}

const TopicsSection: FC<Props> = ({
  topics,
  upsertTopic,
  removeTopic,
  subjectName,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Topic | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (d: TopicCreate | TopicUpdate) => {
    setSubmitting(true);
    await upsertTopic(d, editing?.id);
    setSubmitting(false);
    setDialogOpen(false);
  };

  return (
    <>
      <TopicList
        topics={topics}
        onEditTopic={(t) => {
          setEditing(t);
          setDialogOpen(true);
        }}
        onDeleteTopic={removeTopic}
        onOpenNewTopicDialog={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
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
