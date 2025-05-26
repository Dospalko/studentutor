// frontend/src/components/subjects/TopicList.tsx
"use client";

import { Topic } from '@/services/topicService';
import TopicListItem from './TopicListItem'; // Importuj novovytvorený komponent
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText } from "lucide-react";

interface TopicListProps {
  topics: Topic[];
  onEditTopic: (topic: Topic) => void;
  onDeleteTopic: (topicId: number) => void;
  onOpenNewTopicDialog: () => void;
}

export default function TopicList({
  topics,
  onEditTopic,
  onDeleteTopic,
  onOpenNewTopicDialog,
}: TopicListProps) {
  const sortedTopics = [...topics].sort((a,b) => a.name.localeCompare(b.name));

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl">Témy predmetu</CardTitle>
        <Button onClick={onOpenNewTopicDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Pridať tému
        </Button>
      </CardHeader>
      <CardContent>
        {sortedTopics.length > 0 ? (
          <div className="space-y-4">
            {sortedTopics.map(topic => (
              <TopicListItem
                key={topic.id}
                topic={topic}
                onEdit={() => onEditTopic(topic)}
                onDelete={() => onDeleteTopic(topic.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">Tento predmet zatiaľ nemá žiadne témy.</p>
            <Button variant="secondary" onClick={onOpenNewTopicDialog} className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" /> Pridať prvú tému
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}