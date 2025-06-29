/* ----------------------------------------------------------------------- */
/*  StudyPlanSection.tsx                                                   */
/* ----------------------------------------------------------------------- */
"use client";

import { FC, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label as ShadcnLabel } from "@/components/ui/label";

import { ListChecks, BrainCog } from "lucide-react";

import StudyCalendarView, {
  type CalendarEvent,
} from "@/components/subjects/subjectPage/StudyCalendarView";
import StudyBlockDetailDialog from "@/components/subjects/subjectPage/StudyBlockDetailDialog";

import { StudyPlan } from "@/services/studyPlanService";
import { StudyBlockStatus } from "@/types/study";

/* --------------------------------------------------------------------- */
/*  props                                                                */
/* --------------------------------------------------------------------- */
interface Props {
  studyPlan: StudyPlan | null;
  actionableTopics: number;
  loading: boolean;
  error: string | null;
  onGenerate: (opts?: { forceRegenerate: boolean }) => Promise<void>;
  onUpdateBlock: (
    id: number,
    data: Partial<{
      status: StudyBlockStatus;
      notes: string | null;
      scheduled_at: string;
    }>
  ) => Promise<void>;
}

/* --------------------------------------------------------------------- */
/*  helper –  mini “list view”                                           */
/* --------------------------------------------------------------------- */
const ListView: FC<{ plan: StudyPlan }> = ({ plan }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-muted">
        <tr>
          <th className="px-2 py-1 text-left">Téma</th>
          <th className="px-2 py-1 text-left">Plán</th>
          <th className="px-2 py-1 text-left">Trvanie</th>
          <th className="px-2 py-1 text-left">Status</th>
        </tr>
      </thead>
      <tbody>
        {plan.study_blocks.map((b) => (
          <tr key={b.id} className="border-t">
            <td className="px-2 py-1">{b.topic.name}</td>
            <td className="px-2 py-1">
              {b.scheduled_at
                ? new Date(b.scheduled_at).toLocaleString("sk-SK")
                : "—"}
            </td>
            <td className="px-2 py-1">
              {b.duration_minutes ?? 60} min
            </td>
            <td className="px-2 py-1">
              {b.status.replace(/_/g, " ").toLowerCase()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* --------------------------------------------------------------------- */
/*  main component                                                       */
/* --------------------------------------------------------------------- */
const StudyPlanSection: FC<Props> = ({
  studyPlan,
  actionableTopics,
  loading,
  error,
  onGenerate,
  onUpdateBlock,
}) => {
  const [showCalendar, setShowCalendar] = useState(true);
  const [detail, setDetail] =
    useState<StudyPlan["study_blocks"][0] | null>(null);

  /* ------------------------------------------------------------- */
  const handleToggle = (checked: boolean) => setShowCalendar(checked);

  const handleDrop = async ({
    event,
    start,
  }: {
    event: CalendarEvent;
    start: Date;
    end: Date;
  }) => {
    await onUpdateBlock(event.id, { scheduled_at: start.toISOString() });
  };

  /* ------------------------------------------------------------- */
  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center">
          <ListChecks className="mr-2 h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">Študijný plán</CardTitle>
        </div>

        {/* --- view toggle & generate button --- */}
        <div className="flex items-center gap-4 flex-wrap">
          {studyPlan && studyPlan.study_blocks.length > 0 && (
            <div className="flex items-center space-x-2">
              <ShadcnLabel htmlFor="view-switch">Zoznam</ShadcnLabel>
              <Switch
                id="view-switch"
                checked={showCalendar}
                onCheckedChange={handleToggle}
              />
              <ShadcnLabel htmlFor="view-switch">Kalendár</ShadcnLabel>
            </div>
          )}

          <Button
            size="sm"
            disabled={loading || (actionableTopics === 0 && !studyPlan)}
            onClick={() => onGenerate({ forceRegenerate: !studyPlan })}
          >
            <BrainCog className="mr-2 h-4 w-4" />
            {!studyPlan
              ? "Vygenerovať plán"
              : actionableTopics > 0
              ? "Aktualizovať plán"
              : "Plán je aktuálny"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading && <p className="py-8 text-center">Spracovávam plán…</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && studyPlan && (
          <>
            {showCalendar ? (
              <StudyCalendarView
                studyPlan={studyPlan}
                onSelectEvent={(e) => setDetail(e.resource ?? null)}
                onEventDrop={handleDrop}
                isUpdating={loading}
              />
            ) : (
              <ListView plan={studyPlan} />
            )}
          </>
        )}
      </CardContent>

      {/* detail dialog */}
      {detail && (
        <StudyBlockDetailDialog
          block={detail}
          isOpen={!!detail}
          onOpenChange={(o) => !o && setDetail(null)}
          onUpdateSchedule={(id, date) =>
            onUpdateBlock(id, { scheduled_at: date.toISOString() })
          }
          onUpdateStatus={(id, st) => onUpdateBlock(id, { status: st })}
          onUpdateNotes={(id, notes) => onUpdateBlock(id, { notes })}
          isUpdating={loading}
        />
      )}
    </Card>
  );
};

export default StudyPlanSection;
/* ----------------------------------------------------------------------- */
