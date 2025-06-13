// src/components/subjects/StudyPlanSection.tsx
"use client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ListChecks,
  BrainCog,
} from "lucide-react";
import { FC, useState } from "react";
import { StudyPlan } from "@/services/studyPlanService";
import { StudyBlockStatus } from "@/types/study";
import StudyCalendarView from "@/components/subjects/subjectPage/StudyCalendarView";
import StudyBlockDetailDialog from "@/components/subjects/subjectPage/StudyBlockDetailDialog";
import { Switch } from "@/components/ui/switch";
import { Label as ShadcnLabel } from "@/components/ui/label";

interface Props {
  studyPlan: StudyPlan | null;
  actionableTopics: number;
  loading: boolean;
  error: string | null;
  onGenerate: (opts?: { forceRegenerate: boolean }) => Promise<void>;
  onUpdateBlock: (id: number, data: Partial<{ status: StudyBlockStatus; notes: string | null; scheduled_at: string }>) => Promise<void>;
}

const StudyPlanSection: FC<Props> = ({
  studyPlan,
  actionableTopics,
  loading,
  error,
  onGenerate,
  onUpdateBlock,
}) => {
  const [calendar, setCalendar] = useState(true);
  const [detail, setDetail] = useState<StudyPlan["study_blocks"][0] | null>(null);

  const toggle = () => setCalendar((v) => !v);

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center">
          <ListChecks className="mr-2 h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">Študijný Plán</CardTitle>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {studyPlan && studyPlan.study_blocks.length > 0 && (
            <div className="flex items-center space-x-2">
              <ShadcnLabel htmlFor="view-switch">Zoznam</ShadcnLabel>
              <Switch id="view-switch" checked={calendar} onCheckedChange={toggle} />
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
              ? "Vygenerovať Nový Plán"
              : actionableTopics > 0
              ? "Aktualizovať Plán"
              : "Plán je aktuálny"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading && <p className="py-8 text-center">Spracovávam plán…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && studyPlan && (
          <>
            {calendar ? (
              <StudyCalendarView
                studyPlan={studyPlan}
                onSelectEvent={(e) => setDetail(e.resource ?? null)}
                onEventDrop={({ event, start }) =>
                  onUpdateBlock(event.id, { scheduled_at: start.toISOString() })
                }
                isUpdating={loading}
              />
            ) : (
              /* …tvoj pôvodný “list view” tu môže zostať, skrátené pre prehľadnosť… */
              <p className="text-center py-8">List view tu…</p>
            )}
          </>
        )}
      </CardContent>

      {detail && (
        <StudyBlockDetailDialog
          block={detail}
          isOpen={!!detail}
          onOpenChange={(open) => !open && setDetail(null)}
          onUpdateSchedule={(id, date) =>
            onUpdateBlock(id, { scheduled_at: date.toISOString() })
          }
          onUpdateStatus={(id, status) => onUpdateBlock(id, { status })}
          onUpdateNotes={(id, notes) => onUpdateBlock(id, { notes })}
          isUpdating={loading}
        />
      )}
    </Card>
  );
};

export default StudyPlanSection;
