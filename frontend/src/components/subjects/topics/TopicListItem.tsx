"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { analyzeTopicNow, Topic } from "@/services/topicService";
import { TopicStatus } from "@/types/study";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2, Brain, Clock4 } from "lucide-react";

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */
const formatEnum = (v?: string | null) =>
  v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "N/A";

const aiLabelColor = (s?: number | null) => {
  if (s == null) return { label: "Neznáma", color: "text-gray-500" };
  if (s <= 0.2) return { label: "Veľmi ľahká", color: "text-green-500 dark:text-green-400" };
  if (s <= 0.4) return { label: "Ľahká", color: "text-lime-500 dark:text-lime-400" };
  if (s <= 0.6) return { label: "Stredná", color: "text-yellow-500 dark:text-yellow-400" };
  if (s <= 0.8) return { label: "Ťažká", color: "text-orange-500 dark:text-orange-400" };
  return { label: "Veľmi ťažká", color: "text-red-500 dark:text-red-400" };
};

/* ------------------------------------------------------------------ */
/* component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  topic: Topic;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TopicListItem({ topic, onEdit, onDelete }: Props) {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  /* spustí AI analýzu len po kliknutí */
  const doAnalyze = async () => {
    if (!token) {
      alert("Najprv sa prihláste.");
      return;
    }
    setLoading(true);
    try {
      await analyzeTopicNow(topic.id, token);
      router.refresh(); // natiahne nové ai_* polia
    } catch (e) {
      console.error(e);
      alert("AI analýza zlyhala");
    } finally {
      setLoading(false);
    }
  };

  const ai = aiLabelColor(topic.ai_difficulty_score);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* ------------------------------ hlavička ------------------------------ */}
      <CardHeader className="flex flex-row items-start justify-between bg-muted/30 dark:bg-muted/20 p-4">
        <div className="flex-grow pr-2">
          <CardTitle className="text-lg font-semibold truncate">{topic.name}</CardTitle>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Upraviť" className="h-8 w-8">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label="Zmazať"
            className="text-destructive h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {/* --- nové tlačidlo --- */}
          <Button variant="outline" size="sm" onClick={doAnalyze} disabled={loading}>
            {loading ? "…" : "Generuj AI"}
          </Button>
        </div>
      </CardHeader>

      {/* ------------------------------ telo karty --------------------------- */}
      <CardContent className="p-4 space-y-2 text-sm">
        {/* Status témy */}
        <Badge
          variant={
            topic.status === TopicStatus.COMPLETED
              ? "default"
              : topic.status === TopicStatus.IN_PROGRESS
              ? "secondary"
              : "outline"
          }
        >
          Status: {formatEnum(topic.status)}
        </Badge>

        {/* Používateľom vnímaná náročnosť */}
        {topic.user_difficulty && (
          <p className="text-muted-foreground">
            Vaša náročnosť:{" "}
            <span className="font-semibold text-foreground">
              {formatEnum(topic.user_difficulty)}
            </span>
          </p>
        )}

        {/* AI náročnosť */}
        {topic.ai_difficulty_score != null && (
          <p className={`flex items-center ${ai.color}`}>
            <Brain className="mr-1.5 h-4 w-4" />
            AI Odhad Náročnosti: {ai.label}
            <span className="ml-1 text-xs">({topic.ai_difficulty_score.toFixed(2)})</span>
          </p>
        )}

        {/* AI odhadovaný čas */}
        {topic.ai_estimated_duration && (
          <p className="text-muted-foreground flex items-center">
            <Clock4 className="mr-1.5 h-4 w-4" />
            AI Odhad Času: {topic.ai_estimated_duration} min
          </p>
        )}

        {/* Silné a slabé stránky */}
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

        {/* fallback, keď AI ešte nebežalo a nie sú detaily */}
        {!topic.user_difficulty &&
          topic.ai_difficulty_score == null &&
          !topic.user_strengths &&
          !topic.user_weaknesses && (
            <p className="text-xs text-muted-foreground italic mt-1">
              Pre túto tému neboli zadané žiadne ďalšie detaily.
            </p>
          )}
      </CardContent>
    </Card>
  );
}
