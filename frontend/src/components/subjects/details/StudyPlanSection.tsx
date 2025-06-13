// frontend/src/components/subjects/details/StudyPlanSection.tsx
"use client";

import { useState } from "react";
import { StudyPlan, StudyBlock, GeneratePlanOptions } from "@/services/studyPlanService";
import { StudyBlockStatus } from "@/types/study";
import StudyCalendarView, { CalendarEventData } from "@/components/subjects/StudyCalendarView";
import StudyBlockDetailDialog from "@/components/subjects/StudyBlockDetailDialog"; // Tento už máš
import StudyPlanViewSwitch from "./StudyPlanViewSwitch"; // Nový prepínač

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ListChecks, BrainCog, Loader2, AlertCircle, Calendar as CalendarIcon, Hourglass, Zap, XCircle, CheckCircle2 } from "lucide-react";


const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

interface StudyPlanSectionProps {
  subjectName: string | undefined;
  studyPlan: StudyPlan | null;
  isLoadingPlan: boolean;
  planError: string | null;
  actionableTopicsCount: number; // Počet tém, ktoré sa dajú ešte naplánovať
  onGenerateOrUpdatePlan: (options?: GeneratePlanOptions) => Promise<void>;
  onUpdateBlockStatus: (blockId: number, newStatus: StudyBlockStatus) => Promise<void>;
  onUpdateBlockNotes: (blockId: number, notes: string | null) => Promise<void>;
  onUpdateBlockSchedule: (blockId: number, newStart: Date) => Promise<void>;
  onAssignMaterialToBlock: (blockId: number, materialId: number | null) => Promise<void>; // Nový prop
  isProcessingBlockAction: boolean; // Pre všetky akcie s blokmi
}

export default function StudyPlanSection({
  subjectName,
  studyPlan,
  isLoadingPlan,
  planError,
  actionableTopicsCount,
  onGenerateOrUpdatePlan,
  onUpdateBlockStatus,
  onUpdateBlockNotes,
  onUpdateBlockSchedule,
  onAssignMaterialToBlock,
  isProcessingBlockAction,
}: StudyPlanSectionProps) {
  const [showCalendarView, setShowCalendarView] = useState(true);
  const [selectedBlockForDetail, setSelectedBlockForDetail] = useState<StudyBlock | null>(null);
  const [isBlockDetailDialogOpen, setIsBlockDetailDialogOpen] = useState(false);
  
  const openBlockDetail = (blockOrEventData: StudyBlock | CalendarEventData['resource']) => {
    const blockToDetail = blockOrEventData && 'topic' in blockOrEventData ? blockOrEventData : (blockOrEventData as un)?.resource as StudyBlock;
    if(blockToDetail && 'topic' in blockToDetail) {
        setSelectedBlockForDetail(blockToDetail);
        setIsBlockDetailDialogOpen(true);
    }
  };

  const handleEventDropFromCalendar = async (dropInfo: CalendarEventData) => {
    if (dropInfo.event.id && dropInfo.start) {
      await onUpdateBlockSchedule(Number(dropInfo.event.id), dropInfo.start);
    }
  };

  const mainButtonText = () => {
    if (!studyPlan) return "Vygenerovať Nový Plán";
    if (actionableTopicsCount > 0) return "Aktualizovať Plán";
    if (studyPlan.study_blocks.length === 0 && actionableTopicsCount === 0) return "Pridajte témy";
    return "Plán je aktuálny";
  };

  const isMainButtonDisabled = isLoadingPlan || (calculateActionableTopicsCount() === 0 && !studyPlan);


  // JSX pre zoznam blokov (prekopírované a upravené)
  const renderBlockList = () => (
    studyPlan && (
    <div>
        <div className="mb-4 p-3 bg-muted/50 rounded-md">
            <h3 className="text-lg font-semibold">{studyPlan.name || `Plán pre ${subjectName}`}</h3>
            <p className="text-sm text-muted-foreground">Vytvorený: {new Date(studyPlan.created_at).toLocaleDateString('sk-SK')}<Badge variant="outline" className="ml-2">{formatEnumValue(studyPlan.status)}</Badge></p>
        </div>
        {studyPlan.study_blocks.length > 0 ? (
            <div className="space-y-3">
            {studyPlan.study_blocks.sort((a,b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime() ).map(block => (
                <Card key={block.id} className={`transition-all duration-150 ${block.status === StudyBlockStatus.COMPLETED ? 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20' : ''} ${block.status === StudyBlockStatus.SKIPPED ? 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 opacity-80' : ''} ${block.status === StudyBlockStatus.IN_PROGRESS ? 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <CardHeader className="p-3 sm:p-4 pb-2"><div className="flex items-center justify-between gap-2"><CardTitle className="text-base sm:text-md flex-grow hover:underline cursor-pointer" onClick={() => openBlockDetail(block)}>{block.topic.name}</CardTitle><Badge variant={ block.status === StudyBlockStatus.COMPLETED ? "default" : block.status === StudyBlockStatus.IN_PROGRESS ? "secondary" : block.status === StudyBlockStatus.SKIPPED ? "destructive" : "outline"} className={`text-xs px-1.5 py-0.5 shrink-0 ${block.status === StudyBlockStatus.COMPLETED ? 'bg-green-600 hover:bg-green-700' : ''} ${block.status === StudyBlockStatus.IN_PROGRESS ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>{formatEnumValue(block.status)}</Badge></div>{block.scheduled_at && (<CardDescription className="text-xs flex items-center pt-1"><CalendarIcon className="mr-1.5 h-3 w-3" /> Naplánované: {new Date(block.scheduled_at).toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'short' })}{block.duration_minutes && <span className="ml-2 inline-flex items-center"><Hourglass className="mr-1 h-3 w-3" /> {block.duration_minutes} min</span>}</CardDescription>)}</CardHeader>
                    {block.notes && <CardContent className="px-3 sm:px-4 pb-2 pt-0 text-xs italic text-muted-foreground cursor-pointer hover:underline" onClick={() => openBlockDetail(block)}>{block.notes}</CardContent>}
                    <CardFooter className="flex flex-wrap justify-end gap-2 px-3 sm:px-4 pt-1 pb-2 sm:pb-3">
                        {block.status !== StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.COMPLETED)}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Dokončené</Button>}
                        {block.status !== StudyBlockStatus.IN_PROGRESS && block.status !== StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100 hover:text-blue-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.IN_PROGRESS)}><Zap className="mr-1 h-3.5 w-3.5" /> Začať</Button>}
                        {block.status !== StudyBlockStatus.SKIPPED && block.status !== StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.SKIPPED)}><XCircle className="mr-1 h-3.5 w-3.5" /> Preskočiť</Button>}
                        {block.status === StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-gray-100 hover:text-gray-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.PLANNED)}><Hourglass className="mr-1 h-3.5 w-3.5" /> Znova plánovať</Button>}
                    </CardFooter>
                </Card>
            ))}
            </div>
        ) : ( <div className="text-center py-8 text-muted-foreground"><p className="text-lg font-semibold">Študijný plán je momentálne prázdny.</p><p className="mt-1 text-sm">{actionableTopicsCount > 0 ? "Máte nové témy na naplánovanie. Kliknite na tlačidlo 'Aktualizovať Plán' v hlavičke." : "Všetky témy sú buď naplánované alebo dokončené."}</p></div> )}
    </div>
    )
  );

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center">
          <ListChecks className="mr-2 h-6 w-6 text-primary" />
          <CardTitle className="text-2xl">Študijný Plán</CardTitle>
        </div>
        <div className="flex items-center gap-x-4 gap-y-2 w-full sm:w-auto justify-end flex-wrap">
          {studyPlan && (studyPlan.study_blocks.length > 0 || showCalendarView) && (
            <StudyPlanViewSwitch showCalendarView={showCalendarView} onViewChange={setShowCalendarView} />
          )}
          {!isLoadingPlan && (
            <Button
              onClick={() => onGenerateOrUpdatePlan({ forceRegenerate: !studyPlan })}
              disabled={isMainButtonDisabled}
              size="sm"
            >
              <BrainCog className="mr-2 h-4 w-4" />
              {mainButtonText()}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingPlan && <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-3 text-muted-foreground">Spracovávam plán...</p></div>}
        {!isLoadingPlan && planError && <Alert variant="destructive" className="my-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Chyba Plánu</AlertTitle><AlertDescription>{planError}</AlertDescription></Alert>}
        
        {!isLoadingPlan && !planError && (
            studyPlan ? (
                showCalendarView ? (
                    <StudyCalendarView 
                        studyPlan={studyPlan} 
                        onSelectEvent={(eventData) => openBlockDetail(eventData.resource as StudyBlock)}
                        onEventDrop={handleEventDropFromCalendar}
                        isUpdating={isProcessingBlockAction}
                    />
                ) : renderBlockList()
            ) : ( 
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    <ListChecks className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-1">Študijný plán ešte nebol vygenerovaný.</p>
                    <p className="text-sm">{actionableTopicsCount > 0 ? "Kliknutím na tlačidlo v hlavičke ho môžete vytvoriť." : "Najprv pridajte témy do predmetu."}</p>
                </div>
            )
        )}
      </CardContent>

      {selectedBlockForDetail && subjectName && (
        <StudyBlockDetailDialog
            key={selectedBlockForDetail.id}
            block={selectedBlockForDetail}
            subjectName={subjectName}
            isOpen={isBlockDetailDialogOpen}
            onOpenChange={(open) => { setIsBlockDetailDialogOpen(open); if (!open) setSelectedBlockForDetail(null); }}
            onUpdateSchedule={onUpdateBlockSchedule} 
            onUpdateStatus={onUpdateBlockStatus}
            onUpdateNotes={onUpdateBlockNotes}
            onAssignMaterial={onAssignMaterialToBlock} // Tu je nový prop
            isUpdating={isProcessingBlockAction}
        />
      )}
    </Card>
  );
}