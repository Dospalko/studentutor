// frontend/src/components/subjects/dialogBlocks/BlockStatusInfo.tsx
"use client";

import type { StudyBlock } from "@/services/studyPlanService";
import { StudyBlockStatus } from "@/types/study"; // Pridaj UserDifficulty
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, CheckCircle2, Zap, XCircle, Brain, Thermometer } from "lucide-react"; // Pridaj Brain, Thermometer

const formatEnumValue = (val?: string | null) =>
  val ? val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "N/A";

const getStatusConfig = (status: StudyBlockStatus) => {
  switch (status) {
    case StudyBlockStatus.COMPLETED: return { variant: "default" as const, className: "bg-green-600 hover:bg-green-700 text-white", icon: CheckCircle2 };
    case StudyBlockStatus.IN_PROGRESS: return { variant: "secondary" as const, className: "bg-blue-600 hover:bg-blue-700 text-white", icon: Zap };
    case StudyBlockStatus.SKIPPED: return { variant: "destructive" as const, className: "bg-red-600 hover:bg-red-700 text-white", icon: XCircle };
    default: return { variant: "outline" as const, className: "text-muted-foreground", icon: Clock };
  }
};

// Pomocná funkcia pre AI náročnosť (rovnaká ako v TopicListItem)
const getAiDifficultyLabelAndColor = (score: number | null | undefined): { label: string, colorClass: string } => {
    if (score === null || score === undefined) return { label: "Neznáma", colorClass: "text-muted-foreground" };
    if (score <= 0.2) return { label: "Veľmi ľahká", colorClass: "text-green-600 dark:text-green-400" };
    if (score <= 0.4) return { label: "Ľahká", colorClass: "text-lime-600 dark:text-lime-400" };
    if (score <= 0.6) return { label: "Stredná", colorClass: "text-yellow-600 dark:text-yellow-500" };
    if (score <= 0.8) return { label: "Ťažká", colorClass: "text-orange-600 dark:text-orange-400" };
    return { label: "Veľmi ťažká", colorClass: "text-red-600 dark:text-red-500" };
};

interface BlockStatusInfoProps {
  block: StudyBlock; // Predpokladáme, že StudyBlock obsahuje vnorený objekt topic
}

export default function BlockStatusInfo({ block }: BlockStatusInfoProps) {
  const statusCfg = getStatusConfig(block.status);
  const StatusIcon = statusCfg.icon;
  const aiDifficulty = getAiDifficultyLabelAndColor(block.topic.ai_difficulty_score);

  return (
    <Card className="border-muted/40">
      <CardContent className="p-4 space-y-3">
        {/* Status Bloku */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Status Bloku</span>
          <Badge variant={statusCfg.variant} className={`${statusCfg.className} flex items-center gap-1.5`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {formatEnumValue(block.status)}
          </Badge>
        </div>

        {/* Naplánovaný Čas */}
        {block.scheduled_at && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" /><span>Naplánované</span></div>
            <div className="text-sm font-medium text-right">{new Date(block.scheduled_at).toLocaleString("sk-SK", { dateStyle: "medium", timeStyle: "short" })}</div>
          </div>
        )}

        {/* Trvanie Bloku */}
        {block.duration_minutes != null && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /><span>Trvanie</span></div>
            <span className="text-sm font-medium">{block.duration_minutes} minút</span>
          </div>
        )}
        
        {/* Oddelovač ak sú AI info */}
        {(block.topic.ai_difficulty_score !== null || block.topic.ai_estimated_duration !== null) && <hr className="my-2 border-border/50"/>}

        {/* AI Odhad Náročnosti Témy */}
        {block.topic.ai_difficulty_score !== null && block.topic.ai_difficulty_score !== undefined && (
          <div className="flex items-center justify-between">
             <div className={`flex items-center gap-2 text-sm ${aiDifficulty.colorClass}`}>
                <Brain className="h-4 w-4" />
                <span>AI Náročnosť Témy</span>
            </div>
            <span className={`text-sm font-medium ${aiDifficulty.colorClass}`}>{aiDifficulty.label} ({block.topic.ai_difficulty_score.toFixed(1)})</span>
          </div>
        )}

        {/* AI Odhad Dĺžky Témy */}
        {block.topic.ai_estimated_duration !== null && block.topic.ai_estimated_duration !== undefined && (
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Thermometer className="h-4 w-4" /> {/* Alebo Clock4 */}
                    <span>AI Odhad Času Témy</span>
                </div>
                <span className="text-sm font-medium">{block.topic.ai_estimated_duration} minút</span>
            </div>
        )}
      </CardContent>
    </Card>
  );
}