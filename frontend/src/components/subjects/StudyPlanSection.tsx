// frontend/src/components/subjects/StudyPlanSection.tsx
"use client";

import { StudyPlan, StudyBlock } from '@/services/studyPlanService';
import { StudyBlockStatus, StudyPlanStatus } from '@/types/study'; // Uisti sa, že aj TopicStatus je tu, ak ho potrebuješ pre actionableTopicsCount
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { 
    CheckCircle2, XCircle, Zap, Hourglass, ListChecks, BrainCog, Loader2, 
    AlertCircle, Calendar // Uisti sa, že všetky ikony sú importované
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import StudyCalendarView from './StudyCalendarView';

// Pomocná funkcia na formátovanie enum hodnôt
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

interface StudyPlanSectionProps {
  subjectName: string | undefined;
  studyPlan: StudyPlan | null;
  isLoadingPlan: boolean;
  planError: string | null;
  showCalendarView: boolean;
  onToggleView: (isChecked: boolean) => void;
  actionableTopicsCount: number; // Počet tém, ktoré je možné pridať/naplánovať
  onGenerateOrUpdatePlan: (options?: { forceRegenerate?: boolean }) => Promise<void>;
  onUpdateBlockStatus: (blockId: number, status: StudyBlockStatus) => Promise<void>;
  onCalendarEventSelect: (event: { resource?: StudyBlock }) => void; // Pre kliknutie na udalosť v kalendári
  // onEditBlockDetails?: (blockId: number) => void; // Placeholder pre budúcu funkciu
  // onManuallyAddBlock?: () => void; // Placeholder
}

export default function StudyPlanSection({
  subjectName,
  studyPlan,
  isLoadingPlan,
  planError,
  showCalendarView,
  onToggleView,
  actionableTopicsCount,
  onGenerateOrUpdatePlan,
  onUpdateBlockStatus,
  onCalendarEventSelect
}: StudyPlanSectionProps) {

  const sortedStudyBlocks = studyPlan 
    ? [...studyPlan.study_blocks].sort((a,b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())
    : [];

  const hasActivePlan = !!studyPlan && studyPlan.status === StudyPlanStatus.ACTIVE;
  const planHasBlocks = hasActivePlan && sortedStudyBlocks.length > 0;

  const mainButtonText = () => {
    if (!hasActivePlan) return "Vygenerovať Nový Plán";
    if (hasActivePlan && !planHasBlocks && actionableTopicsCount > 0) return "Vygenerovať Bloky do Plánu";
    if (hasActivePlan && planHasBlocks && actionableTopicsCount > 0) return "Aktualizovať Plán (pridať nové témy)";
    if (hasActivePlan && planHasBlocks && actionableTopicsCount === 0) return "Plán je aktuálny";
    if (hasActivePlan && !planHasBlocks && actionableTopicsCount === 0) return "Pridajte témy";
    return "Spracovať Plán";
  };

  const isMainButtonDisabled = isLoadingPlan || (actionableTopicsCount === 0 && !planHasBlocks && !hasActivePlan) || (hasActivePlan && planHasBlocks && actionableTopicsCount === 0);

  // --- Renderovacie funkcie pre jednotlivé stavy ---
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

  const renderNoPlanState = () => (
    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
      <ListChecks className="w-16 h-16 mx-auto mb-4 opacity-50" />
      <p className="text-lg font-medium mb-1">Študijný plán ešte nebol vygenerovaný.</p>
      <p className="text-sm">
        {actionableTopicsCount > 0 
            ? "Kliknutím na tlačidlo v hlavičke ho môžete vytvoriť." 
            : "Najprv pridajte témy do predmetu, aby bolo možné plán vygenerovať."
        }
      </p>
    </div>
  );

  const renderEmptyPlanState = () => (
     <div className="text-center py-8 text-muted-foreground">
        <p className="text-lg font-semibold">Študijný plán je momentálne prázdny.</p>
        <p className="mt-1 text-sm">
            {actionableTopicsCount > 0
            ? "Máte nové témy na naplánovanie. Kliknite na tlačidlo 'Aktualizovať Plán' alebo 'Vygenerovať Bloky' v hlavičke."
            : "Všetky témy sú buď naplánované alebo dokončené. Pridajte nové témy do predmetu, ak chcete rozšíriť plán."}
        </p>
        {/* TODO: Placeholder pre tlačidlo na manuálne pridanie bloku
        <Button variant="outline" size="sm" className="mt-4" onClick={() => alert('Manuálne pridať blok - TODO')}>
            <PlusSquare className="mr-2 h-4 w-4" /> Pridať študijný blok manuálne
        </Button>
        */}
    </div>
  );
  
  const renderPlanBlocksList = () => (
    <div>
        <div className="mb-4 p-3 bg-muted/50 rounded-md">
            <h3 className="text-lg font-semibold">{studyPlan!.name || `Plán pre ${subjectName}`}</h3>
            <p className="text-sm text-muted-foreground">
            Vytvorený: {new Date(studyPlan!.created_at).toLocaleDateString('sk-SK')}
            <Badge variant="outline" className="ml-2">{formatEnumValue(studyPlan!.status)}</Badge>
            </p>
        </div>
        {/* Komentované tlačidlo "Začať odznova" - hlavné tlačidlo už má túto logiku */}
        {/* {planHasBlocks && (
            <div className="mb-4 text-right">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onGenerateOrUpdatePlan({ forceRegenerate: true })} 
                    disabled={isLoadingPlan || actionableTopicsCount === 0} // alebo len isLoadingPlan
                    title="Vytvorí úplne nový plán a starý archivuje"
                >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Začať odznova
                </Button>
            </div>
        )} */}
        {sortedStudyBlocks.length > 0 ? (
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
                            {/* TODO: Tu by mohlo byť tlačidlo na otvorenie StudyBlockDetailDialog */}
                            {/* <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditBlockDetails?.(block.id)}> <Edit className="h-3.5 w-3.5" /> </Button> */}
                            <Badge variant={ block.status === StudyBlockStatus.COMPLETED ? "default" : block.status === StudyBlockStatus.IN_PROGRESS ? "secondary" : block.status === StudyBlockStatus.SKIPPED ? "destructive" : "outline"} 
                                   className={`text-xs px-1.5 py-0.5 shrink-0 ${block.status === StudyBlockStatus.COMPLETED ? 'bg-green-600 hover:bg-green-700' : ''} ${block.status === StudyBlockStatus.IN_PROGRESS ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
                                {formatEnumValue(block.status)}
                            </Badge>
                        </div>
                        {block.scheduled_at && (
                            <CardDescription className="text-xs flex items-center pt-1">
                            <Calendar className="mr-1.5 h-3 w-3" /> {/* Použitá správna ikona Calendar */}
                            Naplánované: {new Date(block.scheduled_at).toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {block.duration_minutes && <span className="ml-2 inline-flex items-center"><Hourglass className="mr-1 h-3 w-3" /> {block.duration_minutes} min</span>}
                            </CardDescription>
                        )}
                    </CardHeader>
                    {block.notes && <CardContent className="px-3 sm:px-4 pb-2 pt-0 text-xs italic text-muted-foreground">{block.notes}</CardContent>}
                    <CardFooter className="flex flex-wrap justify-end gap-2 px-3 sm:px-4 pt-1 pb-2 sm:pb-3">
                        {block.status !== StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.COMPLETED)}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Dokončené</Button>}
                        {block.status !== StudyBlockStatus.IN_PROGRESS && block.status !== StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100 hover:text-blue-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.IN_PROGRESS)}><Zap className="mr-1 h-3.5 w-3.5" /> Začať</Button>}
                        {block.status !== StudyBlockStatus.SKIPPED && block.status !== StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.SKIPPED)}><XCircle className="mr-1 h-3.5 w-3.5" /> Preskočiť</Button>}
                        {block.status === StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-gray-100 hover:text-gray-700" onClick={() => onUpdateBlockStatus(block.id, StudyBlockStatus.PLANNED)}><Hourglass className="mr-1 h-3.5 w-3.5" /> Znova plánovať</Button>}
                    </CardFooter>
                </Card>
            ))}
            </div>
        ) : (
          renderEmptyPlanState()
        )}
    </div>
  );

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center">
              <ListChecks className="mr-2 h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Študijný Plán</CardTitle>
          </div>
          <div className="flex items-center gap-x-4 gap-y-2 w-full sm:w-auto justify-end flex-wrap">
              {planHasBlocks && (
                  <div className="flex items-center space-x-2 order-last sm:order-none">
                      <ShadcnLabel htmlFor="view-switch" className="text-sm font-normal">Zoznam</ShadcnLabel>
                      <Switch id="view-switch" checked={showCalendarView} onCheckedChange={onToggleView} />
                      <ShadcnLabel htmlFor="view-switch" className="text-sm font-normal">Kalendár</ShadcnLabel>
                  </div>
              )}
              {/* Hlavné tlačidlo pre plán */}
              {!isLoadingPlan && subjectName && ( // Pridaná kontrola subjectName
                  <Button 
                      onClick={() => onGenerateOrUpdatePlan({ forceRegenerate: !hasActivePlan })}
                      disabled={isMainButtonDisabled}
                      size="sm"
                  >
                      <BrainCog className="mr-2 h-4 w-4" />
                      {mainButtonText()}
                  </Button>
              )}
              {/* TODO: Pridať tlačidlo "Začať odznova" s forceRegenerate=true, ak je to žiaduce */}
              {/* {hasActivePlan && planHasBlocks && !isLoadingPlan && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onGenerateOrUpdatePlan({ forceRegenerate: true })} 
                    disabled={isLoadingPlan}
                    title="Vytvorí úplne nový plán a starý archivuje"
                 >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Začať odznova
                </Button>
              )} */}
          </div>
      </CardHeader>
      <CardContent>
        {isLoadingPlan && renderLoadingState()}
        {!isLoadingPlan && planError && renderErrorState()}
        {!isLoadingPlan && !planError && (
            hasActivePlan 
                ? ( (showCalendarView && planHasBlocks) // Kalendár zobraz len ak má bloky
                    ? <StudyCalendarView studyPlan={studyPlan} onSelectEvent={onCalendarEventSelect} isUpdating={isLoadingPlan} /> 
                    : renderPlanBlocksList() // Inak (ak nie je kalendár alebo plán nemá bloky) zobraz zoznam
                  )
                : renderNoPlanState() // Ak nie je ani aktívny plán
        )}
      </CardContent>
    </Card>
  );
}