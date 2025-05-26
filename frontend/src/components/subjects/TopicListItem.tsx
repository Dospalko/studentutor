// frontend/src/components/subjects/TopicListItem.tsx
"use client";

import { Topic } from '@/services/topicService';
import { TopicStatus } from '@/types/study';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2 } from "lucide-react";

const NONE_VALUE_PLACEHOLDER = "_none_"; // Ak ho používaš aj tu na filtrovanie

// Pomocná funkcia na formátovanie enum hodnôt
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

interface TopicListItemProps {
  topic: Topic;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TopicListItem({ topic, onEdit, onDelete }: TopicListItemProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between bg-muted/30 p-4">
        <div className="flex-grow pr-2">
          <CardTitle className="text-lg">{topic.name}</CardTitle>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Upraviť tému ${topic.name}`}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/10 hover:bg-destructive/10" onClick={onDelete} aria-label={`Zmazať tému ${topic.name}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2 text-sm">
        <div>
          <Badge
            variant={
              topic.status === TopicStatus.COMPLETED ? "default" :
              topic.status === TopicStatus.IN_PROGRESS ? "secondary" : "outline"
            }
            className={
              topic.status === TopicStatus.COMPLETED ? 'bg-green-500 hover:bg-green-600 text-white' :
              topic.status === TopicStatus.IN_PROGRESS ? 'bg-blue-500 hover:bg-blue-600 text-white' :
              topic.status === TopicStatus.NEEDS_REVIEW ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''
            }
          >
            Status: {formatEnumValue(topic.status)}
          </Badge>
        </div>
        {topic.user_difficulty && topic.user_difficulty.toString() !== NONE_VALUE_PLACEHOLDER && (
          <p className="text-muted-foreground">Vnímaná náročnosť: <span className="font-semibold text-foreground">{formatEnumValue(topic.user_difficulty)}</span></p>
        )}
        {topic.user_strengths && (
          <p className="text-green-700 dark:text-green-500"><span className="font-semibold">Silné stránky:</span> {topic.user_strengths}</p>
        )}
        {topic.user_weaknesses && (
          <p className="text-red-700 dark:text-red-500"><span className="font-semibold">Slabé stránky:</span> {topic.user_weaknesses}</p>
        )}
        {(!topic.user_difficulty || topic.user_difficulty.toString() === NONE_VALUE_PLACEHOLDER) && !topic.user_strengths && !topic.user_weaknesses && (
          <p className="text-xs text-muted-foreground italic">Pre túto tému neboli zadané žiadne ďalšie detaily.</p>
        )}
      </CardContent>
    </Card>
  );
}