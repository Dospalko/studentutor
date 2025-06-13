// frontend/src/components/subjects/dialogBlocks/BlockStatusInfo.tsx
"use client";

import type { StudyBlock } from "@/services/studyPlanService";
import { StudyBlockStatus } from "@/types/study";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Clock, CheckCircle2, Zap, XCircle } from "lucide-react"; // Ikonu Clock som premenoval z pôvodného kódu, aby nekolidovala

const formatEnumValue = (val?: string | null) =>
  val ? val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "N/A";

const getStatusConfig = (status: StudyBlockStatus) => {
  // ... (funkcia getStatusConfig zostáva rovnaká ako si mal v StudyBlockDetailDialog)
  switch (status) {
    case StudyBlockStatus.COMPLETED: return { variant: "default" as const, className: "bg-green-500 border-green-500 hover:bg-green-600 text-white", icon: CheckCircle2 };
    case StudyBlockStatus.IN_PROGRESS: return { variant: "secondary" as const, className: "bg-blue-500 border-blue-500 hover:bg-blue-600 text-white", icon: Zap };
    case StudyBlockStatus.SKIPPED: return { variant: "destructive" as const, className: "bg-red-500 border-red-500 hover:bg-red-600 text-white", icon: XCircle };
    default: return { variant: "outline" as const, className: "border-muted-foreground/20 text-muted-foreground", icon: Clock };
  }
};

interface BlockStatusInfoProps {
  block: StudyBlock;
}

export default function BlockStatusInfo({ block }: BlockStatusInfoProps) {
  const statusCfg = getStatusConfig(block.status);
  const StatusIcon = statusCfg.icon;

  return (
    <Card className="border-muted/40">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Status</span>
          <Badge variant={statusCfg.variant} className={`${statusCfg.className} flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {formatEnumValue(block.status)}
          </Badge>
        </div>

        {block.scheduled_at && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <span>Naplánované</span>
            </div>
            <div className="text-sm font-medium text-right">
              {new Date(block.scheduled_at).toLocaleString("sk-SK", { dateStyle: "medium", timeStyle: "short" })}
            </div>
          </div>
        )}

        {block.duration_minutes != null && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Trvanie</span>
            </div>
            <span className="text-sm font-medium">{block.duration_minutes} minút</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}