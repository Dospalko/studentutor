// frontend/src/app/subjects/[subjectId]/page.tsx
"use client";

import { useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthContext } from '@/context/AuthContext';
import { getSubjectById, Subject } from '@/services/subjectService';
import { 
    Topic, TopicCreate, TopicUpdate, 
    createTopicForSubject, updateTopic, deleteTopic 
} from '@/services/topicService';
import { 
    StudyPlan, StudyBlock, StudyPlanCreate, StudyBlockUpdate, 
    generateOrGetStudyPlan, getActiveStudyPlanForSubject, updateStudyBlock, 
    GeneratePlanOptions 
} from '@/services/studyPlanService';
import { 
    TopicStatus, 
    StudyBlockStatus 
} from '@/types/study';

// Import sub-komponentov
import TopicList from '@/components/subjects/TopicList';
import TopicFormDialog from '@/components/subjects/TopicFormDialog';
import StudyCalendarView from '@/components/subjects/StudyCalendarView'; // Import komponentu kalendára

// Shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label as ShadcnLabel } from "@/components/ui/label"; // Alias pre Label z shadcn, aby nekolidoval s HTML <label>

import { 
    ArrowLeft, AlertCircle, Loader2, FileText, 
    ListChecks, BrainCog, Calendar, CheckCircle2, // Pridaj CheckCircle2 ikonu 
    Hourglass, Zap, XCircle // Ďalšie ikony potrebné v komponente
} from "lucide-react";


// Pomocná funkcia na formátovanie enum hodnôt (ak ju potrebuješ priamo tu)
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

function SubjectDetailPageContent() {
  const authContext = useContext(AuthContext);
  const params = useParams();
  const router = useRouter();
  const subjectIdParam = params.subjectId as string;

  // Stavy pre Predmet a Témy
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stavy pre dialóg tém
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

  // Stavy pre Študijný Plán
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [showCalendarView, setShowCalendarView] = useState(true); // Defaultne zobraziť kalendár

  useEffect(() => {
    if (authContext?.token && subjectIdParam) {
      const subjectId = parseInt(subjectIdParam);
      if (isNaN(subjectId)) {
        setError("Neplatné ID predmetu.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true); setError(null); setPlanError(null); setStudyPlan(null);

      getSubjectById(subjectId, authContext.token)
        .then(data => {
          setSubject(data);
          setTopics(data.topics || []);
          if (authContext.token) {
            setIsLoadingPlan(true);
            getActiveStudyPlanForSubject(subjectId, authContext.token)
              .then(planData => setStudyPlan(planData))
              .catch(err => {
                console.error("Error fetching study plan:", err);
                setPlanError((err as Error).message || 'Nepodarilo sa načítať študijný plán.');
              })
              .finally(() => setIsLoadingPlan(false));
          }
        })
        .catch(err => {
          console.error("Error fetching subject details:", err);
          setError((err as Error).message || 'Nepodarilo sa načítať detail predmetu.');
        })
        .finally(() => setIsLoading(false));
    } else if (!subjectIdParam) {
        setError("Chýba ID predmetu.");
        setIsLoading(false);
    }
  }, [authContext?.token, subjectIdParam]);

  // --- Handlers pre Témy ---
  const handleOpenNewTopicDialog = () => {
    setEditingTopic(null);
    setIsTopicDialogOpen(true);
  };

  const handleOpenEditTopicDialog = (topic: Topic) => {
    setEditingTopic(topic);
    setIsTopicDialogOpen(true);
  };

  const handleTopicFormSubmitCallback = async (data: TopicCreate | TopicUpdate, editingTopicId?: number) => {
    if (!authContext?.token || !subject) return;
    const subjectId = subject.id;
    setIsSubmittingTopic(true);
    setError(null);

    try {
        if (editingTopicId && editingTopic) {
            const updated = await updateTopic(editingTopicId, data as TopicUpdate, authContext.token);
            setTopics(prevTopics => prevTopics.map(t => t.id === updated.id ? updated : t).sort((a, b) => a.name.localeCompare(b.name)));
        } else {
            const created = await createTopicForSubject(subjectId, data as TopicCreate, authContext.token);
            setTopics(prevTopics => [created, ...prevTopics].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setIsTopicDialogOpen(false);
    } catch (err: unknown) {
        console.error("Error submitting topic:", err);
        setError(err instanceof Error ? err.message : (editingTopicId ? 'Nepodarilo sa aktualizovať tému.' : 'Nepodarilo sa vytvoriť tému.'));
    } finally {
        setIsSubmittingTopic(false);
    }
  };

  const handleDeleteTopicCallback = async (topicId: number) => {
    if (!authContext?.token) return;
    if (!window.confirm('Naozaj chcete zmazať túto tému? Jej bloky budú tiež odstránené z aktívneho plánu (ak existujú).')) return;
    
    setError(null);
    try {
        await deleteTopic(topicId, authContext.token);
        setTopics(prevTopics => prevTopics.filter(t => t.id !== topicId));
        if (studyPlan && studyPlan.study_blocks.some(b => b.topic_id === topicId) && subject) {
            console.log("Topic deleted was in plan, refetching plan to reflect changes...");
            setIsLoadingPlan(true);
            getActiveStudyPlanForSubject(subject.id, authContext.token) // Použi subject.id pre istotu
              .then(planData => setStudyPlan(planData))
              .catch(err => setPlanError((err as Error).message || 'Chyba pri obnovení plánu po zmazaní témy.'))
              .finally(() => setIsLoadingPlan(false));
        }
    } catch (err: unknown) {
        console.error("Error deleting topic:", err);
        setError(err instanceof Error ? err.message : "Nepodarilo sa zmazať tému.");
    }
  };
  
  // --- Handlers pre Študijný Plán ---
  const handleGenerateOrUpdatePlanCallback = async (options?: GeneratePlanOptions) => {
    if (!authContext?.token || !subject) return;
    setIsLoadingPlan(true); setPlanError(null);
    
    const planData: StudyPlanCreate = { 
        subject_id: subject.id,
        name: studyPlan?.name || undefined // Zachovaj existujúce meno alebo nechaj backend vygenerovať
    };

    try {
      const newOrUpdatedPlan = await generateOrGetStudyPlan(planData, authContext.token, options);
      setStudyPlan(newOrUpdatedPlan);
    } catch (err) {
      console.error("Error processing study plan:", err);
      setPlanError((err as Error).message || 'Nepodarilo sa spracovať študijný plán.');
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleUpdateBlockStatusCallback = async (blockId: number, newStatus: StudyBlockStatus) => {
    if (!authContext?.token || !studyPlan) return;
    
    const originalBlocks = studyPlan.study_blocks;
    const updatedBlocksOptimistic = originalBlocks.map(block =>
      block.id === blockId ? { ...block, status: newStatus } : block
    );
    setStudyPlan(prev => prev ? { ...prev, study_blocks: updatedBlocksOptimistic } : null);
    setPlanError(null);

    const blockData: StudyBlockUpdate = { status: newStatus };
    try {
      const updatedBlockResponse = await updateStudyBlock(blockId, blockData, authContext.token);
      
      setStudyPlan(prevPlan => {
        if (!prevPlan) return null;
        const newBlocks = prevPlan.study_blocks.map(b =>
            b.id === updatedBlockResponse.id 
            ? { ...updatedBlockResponse, topic: originalBlocks.find(ob => ob.topic_id === updatedBlockResponse.topic_id)?.topic || b.topic } 
            : b
        );
        return { ...prevPlan, study_blocks: newBlocks.sort((a,b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()) };
      });
      
      if (newStatus === StudyBlockStatus.COMPLETED) {
        const affectedTopicId = originalBlocks.find(b => b.id === blockId)?.topic_id;
        if (affectedTopicId) {
            setTopics(prevTopics => prevTopics.map(t =>
                t.id === affectedTopicId && t.status !== TopicStatus.COMPLETED ? { ...t, status: TopicStatus.COMPLETED } : t
            ));
        }
      }
    } catch (err) {
      console.error("Error updating study block:", err);
      setPlanError((err as Error).message || 'Nepodarilo sa aktualizovať študijný blok.');
      setStudyPlan(prev => prev ? { ...prev, study_blocks: originalBlocks } : null);
    }
  };

  const calculateActionableTopicsCount = () => {
    if (!topics || topics.length === 0) return 0;
    const uncompletedTopics = topics.filter(t => t.status !== TopicStatus.COMPLETED);
    if (!studyPlan) {
        return uncompletedTopics.length;
    }
    const plannedTopicIds = studyPlan.study_blocks.map(b => b.topic_id);
    return uncompletedTopics.filter(t => !plannedTopicIds.includes(t.id)).length;
  };

  // --- Stavy pre UI (Loading, Error, Not Found) ---
  if (!authContext?.token || (!authContext?.user && isLoading)) {
    return (<div className="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Načítavam...</p></div>);
  }
  if (isLoading) {
    return (<div className="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Načítavam detail predmetu...</p></div>);
  }
  if (error && !subject) {
    return (<div className="container mx-auto p-4 text-center mt-10"><Alert variant="destructive" className="max-w-md mx-auto"><AlertCircle className="h-4 w-4" /><AlertTitle>Chyba</AlertTitle><AlertDescription>{error}</AlertDescription></Alert><Button onClick={() => router.push('/dashboard')} className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Späť na Dashboard</Button></div>);
  }
  if (!subject) {
    return (<div className="container mx-auto p-4 text-center mt-10"><Alert className="max-w-md mx-auto"><FileText className="h-4 w-4" /><AlertTitle>Predmet nenájdený</AlertTitle><AlertDescription>Zdá sa, že tento predmet neexistuje alebo k nemu nemáte prístup.</AlertDescription></Alert><Button onClick={() => router.push('/dashboard')} className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Späť na Dashboard</Button></div>);
  }

  // Handler pre kliknutie na udalosť v kalendári (pre StudyCalendarView)
  const handleCalendarEventSelect = (calendarEvent: { resource?: StudyBlock }) => {
    const block = calendarEvent.resource;
    if (!block) return;
    
    // Tu môžeš otvoriť dialóg s detailmi bloku, alebo zobraziť nejaké info.
    // Pre jednoduchosť zatiaľ len alert, ale ideálne by to bol napr. shadcn Drawer alebo Dialog.
    alert(
      `Študijný Blok: ${block.topic.name}\n` +
      `Status: ${formatEnumValue(block.status)}\n` +
      `Naplánované: ${block.scheduled_at ? new Date(block.scheduled_at).toLocaleString('sk-SK') : 'N/A'}\n` +
      `Trvanie: ${block.duration_minutes ? `${block.duration_minutes} min` : 'N/A'}`
    );
    // TODO: Implementovať krajší detail bloku (napr. pomocou Drawer alebo Dialogu)
    // A pridať možnosť meniť status priamo odtiaľto.
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Späť na Dashboard
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Chyba Operácie s Témou</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold">{subject.name}</CardTitle>
          {subject.description && <CardDescription className="text-lg mt-2">{subject.description}</CardDescription>}
        </CardHeader>
      </Card>

      <TopicList
        topics={topics}
        onEditTopic={handleOpenEditTopicDialog}
        onDeleteTopic={handleDeleteTopicCallback}
        onOpenNewTopicDialog={handleOpenNewTopicDialog}
      />

      <TopicFormDialog
        isOpen={isTopicDialogOpen}
        onOpenChange={setIsTopicDialogOpen}
        editingTopic={editingTopic}
        subjectName={subject?.name}
        onSubmit={handleTopicFormSubmitCallback}
        isSubmitting={isSubmittingTopic}
      />
      
      {/* Sekcia Študijný Plán - teraz menggunakan StudyPlanDisplay alebo zoznam */}
      <Card className="mt-8">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center">
                <ListChecks className="mr-2 h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Študijný Plán</CardTitle>
            </div>
            <div className="flex items-center gap-x-4 gap-y-2 w-full sm:w-auto justify-end flex-wrap">
                {/* Prepínač pohľadu */}
                {studyPlan && studyPlan.study_blocks.length > 0 && (
                    <div className="flex items-center space-x-2 order-last sm:order-none">
                        <ShadcnLabel htmlFor="view-switch" className="text-sm font-normal">Zoznam</ShadcnLabel>
                        <Switch
                            id="view-switch"
                            checked={showCalendarView}
                            onCheckedChange={setShowCalendarView}
                            aria-label="Prepnúť pohľad plánu"
                        />
                        <ShadcnLabel htmlFor="view-switch" className="text-sm font-normal">Kalendár</ShadcnLabel>
                    </div>
                )}
                {/* Tlačidlo na generovanie/aktualizáciu */}
                {!isLoadingPlan && ( // Zobraz tlačidlo len ak sa plán nenahráva
                    <Button 
                        onClick={() => handleGenerateOrUpdatePlanCallback({ forceRegenerate: !studyPlan })}
                        disabled={isLoadingPlan || (calculateActionableTopicsCount() === 0 && !studyPlan)}
                        size="sm"
                    >
                        <BrainCog className="mr-2 h-4 w-4" />
                        {!studyPlan ? "Vygenerovať Nový Plán" : 
                         (calculateActionableTopicsCount() > 0 ? "Aktualizovať Plán" : 
                          (studyPlan.study_blocks.length === 0 && calculateActionableTopicsCount() === 0 ? "Pridajte témy" : "Plán je aktuálny")
                         )}
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
                            onSelectEvent={handleCalendarEventSelect}
                        />
                    ) : ( 
                        // Zobrazenie plánu ako zoznamu (prekopírované a upravené z StudyPlanDisplay)
                        <div>
                            <div className="mb-4 p-3 bg-muted/50 rounded-md">
                                <h3 className="text-lg font-semibold">{studyPlan.name || `Plán pre ${subject?.name}`}</h3>
                                <p className="text-sm text-muted-foreground">
                                Vytvorený: {new Date(studyPlan.created_at).toLocaleDateString('sk-SK')}
                                <Badge variant="outline" className="ml-2">{formatEnumValue(studyPlan.status)}</Badge>
                                </p>
                            </div>
                            {studyPlan.study_blocks.length > 0 ? (
                                <div className="space-y-3">
                                {studyPlan.study_blocks.sort((a,b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime() ).map(block => (
                                    <Card key={block.id} className={`transition-all duration-150
                                        ${block.status === StudyBlockStatus.COMPLETED ? 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                                        ${block.status === StudyBlockStatus.SKIPPED ? 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 opacity-80' : ''}
                                        ${block.status === StudyBlockStatus.IN_PROGRESS ? 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                                    `}>
                                        <CardHeader className="p-3 sm:p-4 pb-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <CardTitle className="text-base sm:text-md flex-grow">{block.topic.name}</CardTitle>
                                            <Badge variant={ block.status === StudyBlockStatus.COMPLETED ? "default" : block.status === StudyBlockStatus.IN_PROGRESS ? "secondary" : block.status === StudyBlockStatus.SKIPPED ? "destructive" : "outline"} 
                                                   className={`text-xs px-1.5 py-0.5 shrink-0 ${block.status === StudyBlockStatus.COMPLETED ? 'bg-green-600 hover:bg-green-700' : ''} ${block.status === StudyBlockStatus.IN_PROGRESS ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
                                                {formatEnumValue(block.status)}
                                            </Badge>
                                        </div>
                                        {block.scheduled_at && (
                                            <CardDescription className="text-xs flex items-center pt-1">
                                            <Calendar className="mr-1.5 h-3 w-3" /> {/* Použi Calendar ikonu */}
                                            Naplánované: {new Date(block.scheduled_at).toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            {block.duration_minutes && <span className="ml-2 inline-flex items-center"><Hourglass className="mr-1 h-3 w-3" /> {block.duration_minutes} min</span>}
                                            </CardDescription>
                                        )}
                                        </CardHeader>
                                        {block.notes && <CardContent className="px-3 sm:px-4 pb-2 pt-0 text-xs italic text-muted-foreground">{block.notes}</CardContent>}
                                        <CardFooter className="flex flex-wrap justify-end gap-2 px-3 sm:px-4 pt-1 pb-2 sm:pb-3">
                                            {block.status !== StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleUpdateBlockStatusCallback(block.id, StudyBlockStatus.COMPLETED)}><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Dokončené</Button>}
                                            {block.status !== StudyBlockStatus.IN_PROGRESS && block.status !== StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-100 hover:text-blue-700" onClick={() => handleUpdateBlockStatusCallback(block.id, StudyBlockStatus.IN_PROGRESS)}><Zap className="mr-1 h-3.5 w-3.5" /> Začať</Button>}
                                            {block.status !== StudyBlockStatus.SKIPPED && block.status !== StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleUpdateBlockStatusCallback(block.id, StudyBlockStatus.SKIPPED)}><XCircle className="mr-1 h-3.5 w-3.5" /> Preskočiť</Button>}
                                            {block.status === StudyBlockStatus.COMPLETED && <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-gray-100 hover:text-gray-700" onClick={() => handleUpdateBlockStatusCallback(block.id, StudyBlockStatus.PLANNED)}><Hourglass className="mr-1 h-3.5 w-3.5" /> Znova plánovať</Button>}
                                        </CardFooter>
                                    </Card>
                                ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p className="text-lg font-semibold">Študijný plán je momentálne prázdny.</p>
                                    <p className="mt-1 text-sm">
                                        {calculateActionableTopicsCount() > 0
                                        ? "Máte nové témy na naplánovanie. Kliknite na 'Aktualizovať Plán' alebo 'Vygenerovať Bloky' vyššie."
                                        : "Všetky témy sú buď naplánované alebo dokončené. Pridajte nové témy do predmetu, ak chcete rozšíriť plán."}
                                    </p>
                                </div>
                            )}
                        </div>
                    )
                ) : (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                        <ListChecks className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-1">Študijný plán ešte nebol vygenerovaný.</p>
                        <p className="text-sm">
                            {calculateActionableTopicsCount() > 0 
                                ? "Kliknutím na tlačidlo vyššie ho môžete vytvoriť." 
                                : "Najprv pridajte témy do predmetu, aby bolo možné plán vygenerovať."
                            }
                        </p>
                    </div>
                )
            )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hlavný export stránky
export default function SubjectDetailPage() {
  return (
    <ProtectedRoute>
      <SubjectDetailPageContent />
    </ProtectedRoute>
  );
}