"use client";

import { useState } from "react";
import { Topic, analyzeTopicNow } from "@/services/topicService";
import { useAuth } from "@/hooks/useAuth";
import { TopicStatus } from "@/types/study";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2, Brain, Clock4 } from "lucide-react";

/* helper: enum → Readable */
const fmt = (v?: string | null) =>
  v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "N/A";

/* helper: label + colour for score */
const aiColour = (s?: number | null) => {
  if (s == null) return { l: "Neznáma", c: "text-gray-500" };
  if (s <= 0.2) return { l: "Veľmi ľahká", c: "text-green-500 dark:text-green-400" };
  if (s <= 0.4) return { l: "Ľahká", c: "text-lime-500 dark:text-lime-400" };
  if (s <= 0.6) return { l: "Stredná", c: "text-yellow-500 dark:text-yellow-400" };
  if (s <= 0.8) return { l: "Ťažká", c: "text-orange-500 dark:text-orange-400" };
  return { l: "Veľmi ťažká", c: "text-red-500 dark:text-red-400" };
};

interface Props {
  topic: Topic;
  onEdit: () => void;
  onDelete: () => void;
  /** dostane späť tému s aktualizovanými ai_* po úspešnej analýze */
  onTopicUpdate: (t: Topic) => void;
}

export default function TopicListItem({ topic, onEdit, onDelete, onTopicUpdate }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!token) { alert("Najprv sa prihláste."); return; }
    setLoading(true);
    try {
      const updated = await analyzeTopicNow(topic.id, token); // POST /analyze-ai
      onTopicUpdate(updated);                                 // ↑ do stavu
    } catch (e) {
      console.error(e);
      alert("AI analýza zlyhala");
    } finally {
      setLoading(false);
    }
  };

  const ai = aiColour(topic.ai_difficulty_score);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="flex justify-between bg-muted/30 p-4">
        <CardTitle className="truncate font-semibold">{topic.name}</CardTitle>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Upraviť">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Zmazať"
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={loading}>
            {loading ? "…" : "Generuj AI"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-2 text-sm">
        {/* status */}
        <Badge
          variant={
            topic.status === TopicStatus.COMPLETED
              ? "default"
              : topic.status === TopicStatus.IN_PROGRESS
              ? "secondary"
              : "outline"
          }
        >
          Status: {fmt(topic.status)}
        </Badge>

        {/* user difficulty */}
        {topic.user_difficulty && (
          <p className="text-muted-foreground">
            Vaša náročnosť: <span className="font-semibold">{fmt(topic.user_difficulty)}</span>
          </p>
        )}

        {/* AI difficulty */}
        {topic.ai_difficulty_score != null && (
          <p className={`flex items-center ${ai.c}`}>
            <Brain className="mr-1.5 h-4 w-4" />
            AI Odhad Náročnosti: {ai.l}
            <span className="ml-1 text-xs">({topic.ai_difficulty_score.toFixed(2)})</span>
          </p>
        )}

        {/* AI čas */}
        {topic.ai_estimated_duration && (
          <p className="flex items-center text-muted-foreground">
            <Clock4 className="mr-1.5 h-4 w-4" />
            AI Odhad Času: {topic.ai_estimated_duration} min
          </p>
        )}

        {/* strengths / weaknesses */}
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

        {/* fallback */}
        {!topic.user_difficulty &&
          topic.ai_difficulty_score == null &&
          !topic.user_strengths &&
          !topic.user_weaknesses && (
            <p className="text-xs text-muted-foreground italic">
              Pre túto tému neboli zadané ďalšie detaily.
            </p>
          )}
      </CardContent>
    </Card>
  );
}
