// frontend/src/app/subjects/[subjectId]/page.tsx -> SubjectDetailPageContent
"use client";

import { useContext, useEffect, useState, } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthContext } from '@/context/AuthContext';
import { getSubjectById, Subject } from '@/services/subjectService';
import { Topic, TopicCreate, TopicUpdate, createTopicForSubject, updateTopic, deleteTopic } from '@/services/topicService';
import { StudyPlan, StudyPlanCreate, StudyBlockUpdate, generateOrGetStudyPlan, getActiveStudyPlanForSubject, updateStudyBlock } from '@/services/studyPlanService';
import { TopicStatus,  StudyBlockStatus,  } from '@/types/study';

// Importuj nové komponenty
import TopicList from '@/components/subjects/TopicList';
import TopicFormDialog from '@/components/subjects/TopicFormDialog';
import StudyPlanDisplay from '@/components/subjects/StudyPlanDisplay';

// Shadcn/ui imports (len tie, čo sú priamo použité tu)
import { Button } from "@/components/ui/button";
import { Card,  CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // CardFooter tu asi nie je
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

  // Stavy pre dialóg tém (zostávajú tu, lebo dialóg sa volá odtiaľto)
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
    setEditingTopic(null); // Dôležité pre TopicFormDialog
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
        if (editingTopicId && editingTopic) { // Úprava
            const updated = await updateTopic(editingTopicId, data as TopicUpdate, authContext.token);
            setTopics(prevTopics => prevTopics.map(t => t.id === updated.id ? updated : t).sort((a, b) => a.name.localeCompare(b.name)));
        } else { // Vytvorenie
            const created = await createTopicForSubject(subjectId, data as TopicCreate, authContext.token);
            setTopics(prevTopics => [created, ...prevTopics].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setIsTopicDialogOpen(false); // Zavri dialóg po úspechu
    } catch (err: unknown) {
        console.error("Error submitting topic:", err);
        setError(err instanceof Error ? err.message : (editingTopicId ? 'Nepodarilo sa aktualizovať tému.' : 'Nepodarilo sa vytvoriť tému.'));
        // Nechaj dialóg otvorený, aby používateľ mohol opraviť chybu alebo to skúsiť znova
    } finally {
        setIsSubmittingTopic(false);
    }
  };

  const handleDeleteTopicCallback = async (topicId: number) => {
    if (!authContext?.token) return;
    if (!window.confirm('Naozaj chcete zmazať túto tému?')) return;
    
    setError(null);
    try {
        await deleteTopic(topicId, authContext.token);
        setTopics(prevTopics => prevTopics.filter(t => t.id !== topicId));
    } catch (err: unknown) {
        console.error("Error deleting topic:", err);
        setError(err instanceof Error ? err.message : "Nepodarilo sa zmazať tému.");
    }
  };
  
  // --- Handlers pre Študijný Plán ---
  const handleGeneratePlanCallback = async () => {
    if (!authContext?.token || !subject) return;
    setIsLoadingPlan(true); setPlanError(null);
    const planData: StudyPlanCreate = { subject_id: subject.id };
    try {
      const newPlan = await generateOrGetStudyPlan(planData, authContext.token);
      setStudyPlan(newPlan);
    } catch (err) {
      console.error("Error generating study plan:", err);
      setPlanError((err as Error).message || 'Nepodarilo sa vygenerovať študijný plán.');
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
    setStudyPlan({ ...studyPlan, study_blocks: updatedBlocksOptimistic });
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
        return { ...prevPlan, study_blocks: newBlocks };
      });
      if (newStatus === StudyBlockStatus.COMPLETED) {
        const affectedTopicId = originalBlocks.find(b => b.id === blockId)?.topic_id;
        if (affectedTopicId) {
            setTopics(prevTopics => prevTopics.map(t =>
                t.id === affectedTopicId ? { ...t, status: TopicStatus.COMPLETED } : t
            ));
        }
      }
    } catch (err) {
      console.error("Error updating study block:", err);
      setPlanError((err as Error).message || 'Nepodarilo sa aktualizovať študijný blok.');
      setStudyPlan({ ...studyPlan, study_blocks: originalBlocks });
    }
  };

  // --- Stavy pre UI ---
  if (!authContext?.token || (!authContext?.user && isLoading)) {
    return (<div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Načítavam...</p></div>);
  }
  if (isLoading) {
    return (<div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Načítavam detail predmetu...</p></div>);
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

      {/* Karta Predmetu (Môže byť samostatný komponent SubjectHeaderCard) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold">{subject.name}</CardTitle>
          {subject.description && <CardDescription className="text-lg mt-2">{subject.description}</CardDescription>}
        </CardHeader>
      </Card>

      {/* Zoznam Tém */}
      <TopicList
        topics={topics}
        onEditTopic={handleOpenEditTopicDialog}
        onDeleteTopic={handleDeleteTopicCallback}
        onOpenNewTopicDialog={handleOpenNewTopicDialog}
      />

      {/* Dialóg pre Témy */}
      <TopicFormDialog
        isOpen={isTopicDialogOpen}
        onOpenChange={setIsTopicDialogOpen}
        editingTopic={editingTopic}
        subjectName={subject?.name}
        onSubmit={handleTopicFormSubmitCallback}
        isSubmitting={isSubmittingTopic}
      />

      {/* Zobrazenie Študijného Plánu */}
      <StudyPlanDisplay
        subjectName={subject?.name}
        studyPlan={studyPlan}
        isLoadingPlan={isLoadingPlan}
        planError={planError}
        topicsCount={topics.length}
        onGeneratePlan={handleGeneratePlanCallback}
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