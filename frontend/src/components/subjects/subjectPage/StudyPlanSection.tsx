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
import { Badge } from "@/components/ui/badge";
import { ListChecks, BrainCog, CalendarIcon, List, Sparkles, Clock, Target, TrendingUp, CheckCircle2, AlertCircle, Pause } from 'lucide-react';
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
/*  helper – enhanced "list view"                                       */
/* --------------------------------------------------------------------- */
const ListView: FC<{ plan: StudyPlan }> = ({ plan }) => {
  const getStatusIcon = (status: StudyBlockStatus) => {
    switch (status) {
      case StudyBlockStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case StudyBlockStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-blue-600" />;
      case StudyBlockStatus.SKIPPED:
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Pause className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: StudyBlockStatus) => {
    switch (status) {
      case StudyBlockStatus.COMPLETED:
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300";
      case StudyBlockStatus.IN_PROGRESS:
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
      case StudyBlockStatus.SKIPPED:
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-3">
      {plan.study_blocks.map((block, index) => (
        <Card 
          key={block.id} 
          className="group hover:shadow-lg transition-all duration-300 border-muted/40 hover:border-primary/40"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Topic Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary flex-shrink-0" />
                  <h4 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                    {block.topic.name}
                  </h4>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>
                      {block.scheduled_at
                        ? new Date(block.scheduled_at).toLocaleString("sk-SK")
                        : "Neplánované"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{block.duration_minutes ?? 60} min</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`flex items-center gap-1 ${getStatusColor(block.status)}`}
                >
                  {getStatusIcon(block.status)}
                  <span className="capitalize">
                    {block.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

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
  const [detail, setDetail] = useState<StudyPlan["study_blocks"][0] | null>(null);

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

  // Calculate stats
  const stats = studyPlan ? {
    total: studyPlan.study_blocks.length,
    completed: studyPlan.study_blocks.filter(b => b.status === StudyBlockStatus.COMPLETED).length,
    inProgress: studyPlan.study_blocks.filter(b => b.status === StudyBlockStatus.IN_PROGRESS).length,
    pending: studyPlan.study_blocks.filter(b => b.status === StudyBlockStatus.SKIPPED).length,
  } : null;

  /* ------------------------------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="relative overflow-hidden border-muted/40 shadow-lg">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        
        <CardHeader className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                <ListChecks className="h-6 w-6" />
              </div>
              
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Študijný plán
                </CardTitle>
                
                {studyPlan && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stats?.total} blokov
                    </Badge>
                    
                    {stats && stats.completed > 0 && (
                      <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {stats.completed} dokončených
                      </Badge>
                    )}
                    
                    {actionableTopics > 0 && (
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {actionableTopics} nových tém
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Controls Section */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* View Toggle */}
              {studyPlan && studyPlan.study_blocks.length > 0 && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <List className={`h-4 w-4 transition-colors ${!showCalendar ? 'text-primary' : 'text-muted-foreground'}`} />
                    <ShadcnLabel htmlFor="view-switch" className="text-sm font-medium cursor-pointer">
                      Zoznam
                    </ShadcnLabel>
                  </div>
                  
                  <Switch
                    id="view-switch"
                    checked={showCalendar}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-primary"
                  />
                  
                  <div className="flex items-center gap-2">
                    <ShadcnLabel htmlFor="view-switch" className="text-sm font-medium cursor-pointer">
                      Kalendár
                    </ShadcnLabel>
                    <CalendarIcon className={`h-4 w-4 transition-colors ${showCalendar ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                size="lg"
                disabled={loading || (actionableTopics === 0 && !studyPlan)}
                onClick={() => onGenerate({ forceRegenerate: !studyPlan })}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <BrainCog className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />
                {!studyPlan
                  ? "Vygenerovať plán"
                  : actionableTopics > 0
                  ? "Aktualizovať plán"
                  : "Plán je aktuálny"}
                <Sparkles className="ml-2 h-4 w-4 opacity-70" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content Card */}
      <Card className="border-muted/40 shadow-lg">
        <CardContent className="p-6">
          {loading && (
            <div className="py-16 text-center">
              <div className="inline-flex items-center gap-3 text-primary">
                <BrainCog className="h-6 w-6 animate-spin" />
                <span className="text-lg font-medium">Spracovávam plán…</span>
              </div>
              <p className="text-muted-foreground mt-2">AI analyzuje vaše témy a vytvára optimálny plán</p>
            </div>
          )}

          {error && (
            <div className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && !studyPlan && (
            <div className="py-16 text-center">
              <div className="p-4 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-4">
                <ListChecks className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Vytvorte si študijný plán</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                AI vám pomôže vytvoriť personalizovaný študijný plán na základe vašich tém a preferencií.
              </p>
              <Button
                onClick={() => onGenerate({ forceRegenerate: false })}
                disabled={loading || actionableTopics === 0}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <BrainCog className="mr-2 h-4 w-4" />
                Vygenerovať plán
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {!loading && !error && studyPlan && (
            <div className="space-y-6">
              {/* Stats Overview */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200/50">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-blue-600/80">Celkom blokov</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200/50">
                    <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    <div className="text-sm text-green-600/80">Dokončené</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200/50">
                    <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
                    <div className="text-sm text-orange-600/80">Prebieha</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border border-gray-200/50">
                    <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
                    <div className="text-sm text-gray-600/80">Čakajúce</div>
                  </div>
                </div>
              )}

              {/* Content View */}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
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
    </div>
  );
};

export default StudyPlanSection;
