// frontend/src/app/subjects/[subjectId]/page.tsx
"use client";

import { useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute'; // Uisti sa, že cesta je správna
import { AuthContext } from '@/context/AuthContext'; // Uisti sa, že cesta je správna
import { getSubjectById, Subject } from '@/services/subjectService'; // Uisti sa, že cesta je správna
import { Topic, TopicCreate, TopicUpdate, createTopicForSubject, updateTopic, deleteTopic } from '@/services/topicService'; // Uisti sa, že cesta je správna
import { 
    StudyPlan, StudyPlanCreate, StudyBlockUpdate, // Pridaj StudyBlock
    generateOrGetStudyPlan, getActiveStudyPlanForSubject, updateStudyBlock, GeneratePlanOptions // Pridaj GeneratePlanOptions
} from '@/services/studyPlanService'; // Uisti sa, že cesta je správna
import { TopicStatus, StudyBlockStatus } from '@/types/study'; // Uisti sa, že cesta je správna

// Importuj sub-komponenty
import TopicList from '@/components/subjects/TopicList'; // Uisti sa, že cesta je správna
import TopicFormDialog from '@/components/subjects/TopicFormDialog'; // Uisti sa, že cesta je správna
import StudyPlanDisplay from '@/components/subjects/StudyPlanDisplay'; // Uisti sa, že cesta je správna

// Shadcn/ui imports (len tie, čo sú priamo použité tu, ak nejaké zostali)
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, Loader2, FileText } from "lucide-react";


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
    setError(null); // Vyčisti hlavnú chybu pred odoslaním

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
    if (!window.confirm('Naozaj chcete zmazať túto tému? Jej bloky budú tiež odstránené z plánu.')) return; // Upravená správa
    
    setError(null);
    try {
        await deleteTopic(topicId, authContext.token);
        setTopics(prevTopics => prevTopics.filter(t => t.id !== topicId));
        // Po zmazaní témy je dobré aktualizovať aj plán, ak existoval a obsahoval túto tému
        // Najjednoduchšie je znova načítať plán, alebo ho odstrániť a nechať používateľa vygenerovať nový
        if (studyPlan && studyPlan.study_blocks.some(b => b.topic_id === topicId)) {
            console.log("Topic deleted was in plan, refetching plan...");
            if (subject) { // Uisti sa, že subject existuje
                setIsLoadingPlan(true);
                getActiveStudyPlanForSubject(subject.id, authContext.token)
                  .then(planData => setStudyPlan(planData))
                  .catch(err => setPlanError((err as Error).message || 'Chyba pri obnovení plánu po zmazaní témy.'))
                  .finally(() => setIsLoadingPlan(false));
            }
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
        name: studyPlan?.name || `Plán pre ${subject.name}` // Zachovaj existujúce meno alebo default
    };

    try {
      const newOrUpdatedPlan = await generateOrGetStudyPlan(planData, authContext.token, options);
      setStudyPlan(newOrUpdatedPlan);
      // Po úspešnom (pre)generovaní plánu je dobré znova načítať témy,
      // lebo ich statusy sa mohli zmeniť (ak backend upravuje statusy tém pri generovaní plánu)
      // alebo ak sa statusy blokov menia. Ale naša aktuálna logika to nerobí pri generovaní.
      // Alebo ak `generateOrGetStudyPlan` vracia aktualizované témy v blokoch, tak je to OK.
    } catch (err) {
      console.error("Error processing study plan:", err);
      setPlanError((err as Error).message || 'Nepodarilo sa spracovať študijný plán.');
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleUpdateBlockStatusCallback = async (blockId: number, newStatus: StudyBlockStatus) => {
    if (!authContext?.token || !studyPlan) return; // studyPlan musí existovať
    
    const originalBlocks = studyPlan.study_blocks;
    // Optimistický update UI
    const updatedBlocksOptimistic = originalBlocks.map(block =>
      block.id === blockId ? { ...block, status: newStatus } : block
    );
    setStudyPlan(prev => prev ? { ...prev, study_blocks: updatedBlocksOptimistic } : null);
    setPlanError(null);

    const blockData: StudyBlockUpdate = { status: newStatus };
    try {
      const updatedBlockResponse = await updateStudyBlock(blockId, blockData, authContext.token);
      
      // Nahraď optimistický update skutočnými dátami z backendu
      setStudyPlan(prevPlan => {
        if (!prevPlan) return null;
        const newBlocks = prevPlan.study_blocks.map(b =>
            b.id === updatedBlockResponse.id 
            ? { ...updatedBlockResponse, topic: originalBlocks.find(ob => ob.topic_id === updatedBlockResponse.topic_id)?.topic || b.topic } 
            : b
        );
        return { ...prevPlan, study_blocks: newBlocks.sort((a,b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()) };
      });
      
      // Aktualizuj status témy v lokálnom stave `topics`, ak bol blok dokončený
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
      // Vráť UI na pôvodný stav blokov pred optimistickým updatom
      setStudyPlan(prev => prev ? { ...prev, study_blocks: originalBlocks } : null);
    }
  };

  const calculateActionableTopicsCount = () => {
    if (!topics || topics.length === 0) return 0;
    
    const uncompletedTopics = topics.filter(t => t.status !== TopicStatus.COMPLETED);
    if (!studyPlan) { // Ak plán vôbec neexistuje, všetky nekompletné témy sú "actionable"
        return uncompletedTopics.length;
    }
    // Ak plán existuje (aj prázdny), rátaj len tie nekompletné, čo ešte nie sú v pláne
    const plannedTopicIds = studyPlan.study_blocks.map(b => b.topic_id);
    return uncompletedTopics.filter(t => !plannedTopicIds.includes(t.id)).length;
  };

  // --- Stavy pre UI ---
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
            <AlertTitle>Chyba Operácie</AlertTitle>
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

      <StudyPlanDisplay
        subjectName={subject?.name}
        studyPlan={studyPlan}
        isLoadingPlan={isLoadingPlan}
        planError={planError}
        actionableTopicsCount={calculateActionableTopicsCount()}
        onGenerateOrUpdatePlan={handleGenerateOrUpdatePlanCallback}
        onUpdateBlockStatus={handleUpdateBlockStatusCallback}
      />
    </div>
  );
}

export default function SubjectDetailPage() {
  return (
    <ProtectedRoute>
      <SubjectDetailPageContent />
    </ProtectedRoute>
  );
}