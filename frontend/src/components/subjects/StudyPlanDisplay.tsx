// frontend/src/components/subjects/StudyPlanDisplay.tsx
"use client";

import { StudyPlan } from '@/services/studyPlanService';
import { StudyBlockStatus, StudyPlanStatus } from '@/types/study'; // Pridaj TopicStatus
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    CalendarDays, CheckCircle2, XCircle, Zap, Hourglass, ListChecks, BrainCog, Loader2, RefreshCcw, AlertCircle // Uisti sa, že AlertCircle je tu
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

interface StudyPlanDisplayProps {
  subjectName: string | undefined;
  studyPlan: StudyPlan | null;
  isLoadingPlan: boolean;
  planError: string | null;
  actionableTopicsCount: number;
  onGenerateOrUpdatePlan: (options?: { forceRegenerate?: boolean }) => Promise<void>;
  onUpdateBlockStatus: (blockId: number, status: StudyBlockStatus) => Promise<void>;
}

export default function StudyPlanDisplay({
  subjectName,
  studyPlan,
  isLoadingPlan,
  planError,
  actionableTopicsCount,
  onGenerateOrUpdatePlan,
  onUpdateBlockStatus,
}: StudyPlanDisplayProps) {
  
  const sortedStudyBlocks = studyPlan 
    ? [...studyPlan.study_blocks].sort((a,b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())
    : [];

  const hasActivePlan = !!studyPlan && studyPlan.status === StudyPlanStatus.ACTIVE;
  const planHasBlocks = hasActivePlan && sortedStudyBlocks.length > 0;

  const mainButtonText = () => {
    if (!hasActivePlan) return "Vygenerovať Nový Plán";
    // Ak plán existuje, ale nemá bloky a sú témy na naplánovanie -> Aktualizovať (čo je vlastne prvé generovanie blokov)
    if (hasActivePlan && !planHasBlocks && actionableTopicsCount > 0) return "Vygenerovať Bloky do Plánu";
    // Ak plán existuje, má bloky a sú nové témy na naplánovanie -> Aktualizovať
    if (hasActivePlan && planHasBlocks && actionableTopicsCount > 0) return "Aktualizovať Plán (pridať nové témy)";
    // Ak plán existuje, má bloky a nie sú nové témy -> Plán aktuálny
    if (hasActivePlan && planHasBlocks && actionableTopicsCount === 0) return "Plán je aktuálny";
    // Ak plán existuje, je prázdny a nie sú témy -> Nič na generovanie
    if (hasActivePlan && !planHasBlocks && actionableTopicsCount === 0) return "Pridajte témy na generovanie";
    
    return "Spracovať Plán"; // Fallback
  };

  const isMainButtonDisabled = isLoadingPlan || (actionableTopicsCount === 0 && !planHasBlocks && !hasActivePlan) || (hasActivePlan && planHasBlocks && actionableTopicsCount === 0);


  const renderLoadingState = () => (
    <div className="flex justify-center items-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-3 text-muted-foreground">Spracovávam študijný plán...</p>
    </div>
  );

  const renderErrorState = () => (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Chyba Plánu</AlertTitle>
      <AlertDescription>{planError}</AlertDescription>
    </Alert>
  );

  const renderPlanHeader = () => (
    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <div className="flex items-center">
        <ListChecks className="mr-2 h-6 w-6 text-primary" />
        <CardTitle className="text-2xl">Študijný Plán</CardTitle>
      </div>
      {subjectName && !isLoadingPlan && (
        <div className="flex gap-2 w-full sm:w-auto justify-end flex-wrap">
            {hasActivePlan && planHasBlocks && ( // Možnosť pregenerovať odznova, ak už plán existuje
                 <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onGenerateOrUpdatePlan({ forceRegenerate: true })} 
                    disabled={isLoadingPlan || actionableTopicsCount === 0}
                    title="Vytvorí úplne nový plán a starý archivuje"
                 >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Začať odznova
                </Button>
            )}
            <Button 
                onClick={() => onGenerateOrUpdatePlan({ forceRegenerate: !hasActivePlan })} // Ak nemá aktívny plán, je to ako forceRegenerate
                disabled={isMainButtonDisabled}
                className="flex-grow sm:flex-grow-0"
            >
                <BrainCog className="mr-2 h-4 w-4" />
                {mainButtonText()}
            </Button>
        </div>
      )}
    </CardHeader>
  );

  const renderNoPlanState = () => ( // Zobrazí sa, ak studyPlan je null
    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
      <ListChecks className="w-16 h-16 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium mb-1">Študijný plán ešte nebol vygenerovaný.</p>
      <p className="text-sm">
        {actionableTopicsCount > 0 
            ? "Kliknutím na tlačidlo vyššie ho môžete vytvoriť." 
            : "Najprv pridajte témy do predmetu, aby bolo možné plán vygenerovať."
        }
      </p>
    </div>
  );

  const renderEmptyPlanState = () => ( // Zobrazí sa, ak studyPlan existuje, ale nemá bloky
     <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg font-semibold">Študijný plán je momentálne prázdny.</p>
        <p className="mt-1 text-sm">
            {actionableTopicsCount > 0
            ? "Máte nové témy na naplánovanie. Kliknite na 'Aktualizovať Plán' alebo 'Vygenerovať Bloky' vyššie."
            : "Všetky témy sú buď naplánované alebo dokončené. Pridajte nové témy do predmetu, ak chcete rozšíriť plán."}
        </p>
    </div>
  );
  
  const renderPlanBlocks = () => (
    <div>
      <div className="mb-4 p-3 bg-muted/50 rounded-md">
        <h3 className="text-lg font-semibold">{studyPlan!.name || `Plán pre ${subjectName}`}</h3>
        <p className="text-sm text-muted-foreground">
          Vytvorený: {new Date(studyPlan!.created_at).toLocaleDateString('sk-SK')}
          <Badge variant="outline" className="ml-2">{formatEnumValue(studyPlan!.status)}</Badge>
        </p>
      </div>
      <div className="space-y-3">
        {sortedStudyBlocks.map(block => (
          <Card key={block.id} className={`transition-all duration-150
            ${block.status === StudyBlockStatus.COMPLETED ? 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
            ${block.status === StudyBlockStatus.SKIPPED ? 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 opacity-80' : ''}
            ${block.status === StudyBlockStatus.IN_PROGRESS ? 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
          `}>
            <CardHeader className="p-3 sm:p-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-md flex-grow">{block.topic.name}</CardTitle>
                  <Badge variant={
                      block.status === StudyBlockStatus.COMPLETED ? "default" :
                      block.status === StudyBlockStatus.IN_PROGRESS ? "secondary" :
                      block.status === StudyBlockStatus.SKIPPED ? "destructive" : "outline"
                  } className={`text-xs px-1.5 py-0.5 shrink-0
                      ${block.status === StudyBlockStatus.COMPLETED ? 'bg-green-600 hover:bg-green-700' : ''}
                      ${block.status === StudyBlockStatus.IN_PROGRESS ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  `}>
                      {formatEnumValue(block.status)}
                  </Badge>
              </div>
              {block.scheduled_at && (
                <CardDescription className="text-xs flex items-center pt-1">
                  <CalendarDays className="mr-1.5 h-3 w-3" />
                  Naplánované: {new Date(block.scheduled_at).toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {block.duration_minutes && <span className="ml-2 inline-flex items-center"><Hourglass className="mr-1 h-3 w-3" /> {block.duration_minutes} min</span>}
                </CardDescription>
              )}
            </CardHeader>
            {block.notes && <CardContent className="px-3 sm:px-4 pb-2 pt-0 text-xs italic text-muted-foreground">{block.notes}</CardContent>}
            <CardFooter className="flex flex-wrap justify-end gap-2 px-3 sm:px-4 pt-1 pb-2 sm:pb-3">
              {block.status !== StudyBlockStatus.COMPLETED && (
                <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.COMPLETED)}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Dokončené
                </Button>
              )}
              {block.status !== StudyBlockStatus.IN_PROGRESS && block.status !== StudyBlockStatus.COMPLETED && (
                 <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100 hover:text-blue-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.IN_PROGRESS)}>
                   <Zap className="mr-1 h-3.5 w-3.5" /> Začať
                 </Button>
              )}
              {block.status !== StudyBlockStatus.SKIPPED && block.status !== StudyBlockStatus.COMPLETED && (
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.SKIPPED)}>
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Preskočiť
                </Button>
              )}
               {block.status === StudyBlockStatus.COMPLETED && (
                 <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-gray-100 hover:text-gray-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.PLANNED)}>
                   <Hourglass className="mr-1 h-3.5 w-3.5" /> Znova plánovať
                 </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="mt-8">
      {renderPlanHeader()}
      <CardContent>
        {isLoadingPlan && renderLoadingState()}
        {!isLoadingPlan && planError && renderErrorState()}
        {!isLoadingPlan && !planError && (
            hasActivePlan 
                ? (planHasBlocks ? renderPlanBlocks() : renderEmptyPlanState()) 
                : renderNoPlanState()
        )}
      </CardContent>
    </Card>
  );
}