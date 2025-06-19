"use client";

import { useState } from 'react';
import { Topic } from '@/services/topicService';
import { analyzeTopicNow } from '@/services/topicService';
import { TopicStatus } from '@/types/study';
// Update the import path below to the correct relative path if your auth context file is located elsewhere.
// For example, if it's in 'src/context/auth.tsx', use:
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2, Clock4, Brain } from "lucide-react";

// ----------------------------------------------------
const formatEnumValue = (v?: string | null) =>
  v ? v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'N/A';

const getAiDifficultyLabelAndColor = (s?: number | null) => {
  if (s == null) return { label: 'Neznáma', color: 'text-gray-500' };
  if (s <= 0.2) return { label: 'Veľmi ľahká', color: 'text-green-500 dark:text-green-400' };
  if (s <= 0.4) return { label: 'Ľahká', color: 'text-lime-500 dark:text-lime-400' };
  if (s <= 0.6) return { label: 'Stredná', color: 'text-yellow-500 dark:text-yellow-400' };
  if (s <= 0.8) return { label: 'Ťažká', color: 'text-orange-500 dark:text-orange-400' };
  return { label: 'Veľmi ťažká', color: 'text-red-500 dark:text-red-400' };
};

interface Props {
  topic: Topic;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;   // rodič refetchne zoznam topicov
}

export default function TopicListItem({ topic, onEdit, onDelete, onRefresh }: Props) {
  const { token } = useAuth();
  const [loadingAi, setLoadingAi] = useState(false);

  const aiDifficulty = getAiDifficultyLabelAndColor(topic.ai_difficulty_score);

  const handleAnalyze = async () => {
    try {
      setLoadingAi(true);
      if (!token) {
        alert('Chýba autentifikačný token. Skúste sa prihlásiť znova.');
        return;
      }
      await analyzeTopicNow(topic.id, token);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Nepodarilo sa vygenerovať AI analýzu');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row justify-between bg-muted/30 p-4">
        <CardTitle className="text-lg font-semibold truncate">{topic.name}</CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Upraviť" className="h-8 w-8">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Zmazať"
                  className="text-destructive h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={loadingAi}>
            {loadingAi ? 'Generujem…' : 'Generuj AI'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-2 text-sm">
        {/* Status */}
        <Badge
          variant={
            topic.status === TopicStatus.COMPLETED
              ? 'default'
              : topic.status === TopicStatus.IN_PROGRESS
              ? 'secondary'
              : 'outline'
          }
        >
          Status: {formatEnumValue(topic.status)}
        </Badge>

        {/* AI Náročnosť */}
        {topic.ai_difficulty_score != null && (
          <p className={`flex items-center ${aiDifficulty.color}`}>
            <Brain className="mr-1.5 h-4 w-4" />
            AI Odhad Náročnosti: {aiDifficulty.label}
            <span className="ml-1 text-xs">({topic.ai_difficulty_score.toFixed(2)})</span>
          </p>
        )}

        {/* AI Čas */}
        {topic.ai_estimated_duration && (
          <p className="flex items-center text-muted-foreground">
            <Clock4 className="mr-1.5 h-4 w-4" />
            AI Odhad Času: {topic.ai_estimated_duration} min
          </p>
        )}

        {/* User data */}
        {topic.user_difficulty && (
          <p className="text-muted-foreground">
            Vaša náročnosť: <span className="font-semibold">{formatEnumValue(topic.user_difficulty)}</span>
          </p>
        )}
        {topic.user_strengths && (
          <p className="text-green-700 dark:text-green-500">
            <span className="font-semibold">Silné stránky:</span> {topic.user_strengths}
          </p>
        )}
        {topic.user_weaknesses && (
          <p className="text-red-700 dark:text-red-500">
            <span className="font-semibold">Slabé stránky:</span> {topic.user_weaknesses}
          </p>
        )}

        {/* No details fallback */}
        {!topic.user_difficulty &&
          topic.ai_difficulty_score == null &&
          !topic.user_strengths &&
          !topic.user_weaknesses && (
            <p className="text-xs text-muted-foreground italic">
              Pre túto tému neboli zadané žiadne ďalšie detaily.
            </p>
          )}
      </CardContent>
    </Card>
  );
}
