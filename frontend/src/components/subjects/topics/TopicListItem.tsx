// frontend/src/components/subjects/TopicListItem.tsx
"use client";

import { Topic } from '@/services/topicService';
import { TopicStatus  } from '@/types/study';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2, Clock4, Brain } from "lucide-react"; // Pridané ikony

// Pomocná funkcia na formátovanie enum hodnôt
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return 'N/A'; // Vráť N/A ak je hodnota nedefinovaná
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

// Pomocná funkcia pre AI náročnosť
const getAiDifficultyLabelAndColor = (score: number | null | undefined): { label: string, color: string } => {
    if (score === null || score === undefined) return { label: "Neznáma", color: "text-gray-500" };
    if (score <= 0.2) return { label: "Veľmi ľahká", color: "text-green-500 dark:text-green-400" };
    if (score <= 0.4) return { label: "Ľahká", color: "text-lime-500 dark:text-lime-400" };
    if (score <= 0.6) return { label: "Stredná", color: "text-yellow-500 dark:text-yellow-400" };
    if (score <= 0.8) return { label: "Ťažká", color: "text-orange-500 dark:text-orange-400" };
    return { label: "Veľmi ťažká", color: "text-red-500 dark:text-red-400" };
};

interface TopicListItemProps {
  topic: Topic;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TopicListItem({ topic, onEdit, onDelete }: TopicListItemProps) {
  const aiDifficulty = getAiDifficultyLabelAndColor(topic.ai_difficulty_score);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between bg-muted/30 dark:bg-muted/20 p-4">
        <div className="flex-grow pr-2">
          <CardTitle className="text-lg font-semibold">{topic.name}</CardTitle>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Upraviť tému ${topic.name}`} className="h-8 w-8">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/10 hover:bg-destructive/10 h-8 w-8" onClick={onDelete} aria-label={`Zmazať tému ${topic.name}`}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2 text-sm">
        {/* Status Témy */}
        <div>
          <Badge 
            variant={topic.status === TopicStatus.COMPLETED ? "default" : topic.status === TopicStatus.IN_PROGRESS ? "secondary" : "outline"} 
            className={`font-medium ${
              topic.status === TopicStatus.COMPLETED ? 'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700' : 
              topic.status === TopicStatus.IN_PROGRESS ? 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700' :
              topic.status === TopicStatus.NEEDS_REVIEW ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-yellow-950' :
              'border-border'
            }`}
          >
            Status: {formatEnumValue(topic.status)}
          </Badge>
        </div>

        {/* Používateľom Vnímaná Náročnosť */}
        {topic.user_difficulty && (
          <p className="text-muted-foreground">Vaša náročnosť: <span className="font-semibold text-foreground">{formatEnumValue(topic.user_difficulty)}</span></p>
        )}

        {/* AI Odhadovaná Náročnosť */}
        {topic.ai_difficulty_score !== null && topic.ai_difficulty_score !== undefined && (
          <p className={`flex items-center ${aiDifficulty.color}`}>
            <Brain className="mr-1.5 h-4 w-4" /> AI Odhad Náročnosti: {aiDifficulty.label} 
            <span className="ml-1 text-xs">({topic.ai_difficulty_score.toFixed(2)})</span>
          </p>
        )}

        {/* AI Odhadovaná Dĺžka Štúdia */}
        {topic.ai_estimated_duration && (
          <p className="text-muted-foreground flex items-center">
            <Clock4 className="mr-1.5 h-4 w-4" /> AI Odhad Času: {topic.ai_estimated_duration} minút
          </p>
        )}
        
        {/* Silné a Slabé stránky */}
        {topic.user_strengths && (
          <p className="text-green-700 dark:text-green-500"><span className="font-semibold">Silné stránky:</span> {topic.user_strengths}</p>
        )}
        {topic.user_weaknesses && (
          <p className="text-red-700 dark:text-red-500"><span className="font-semibold">Slabé stránky:</span> {topic.user_weaknesses}</p>
        )}
        
        {/* Ak nie sú žiadne detaily */}
        {!topic.user_difficulty && (topic.ai_difficulty_score === null || topic.ai_difficulty_score === undefined) && !topic.user_strengths && !topic.user_weaknesses && (
          <p className="text-xs text-muted-foreground italic mt-1">Pre túto tému neboli zadané žiadne ďalšie detaily.</p>
        )}
      </CardContent>
    </Card>
  );
}