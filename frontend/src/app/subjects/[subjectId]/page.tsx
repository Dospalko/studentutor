// frontend/src/app/subjects/[subjectId]/page.tsx
"use client";

import { useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthContext } from '@/context/AuthContext';
import { getSubjectById, Subject } from '@/services/subjectService';
import { Topic, TopicCreate, TopicUpdate, createTopicForSubject, updateTopic, deleteTopic } from '@/services/topicService';
import { StudyPlan, StudyPlanCreate, generateOrGetStudyPlan, getActiveStudyPlanForSubject, updateStudyBlock, GeneratePlanOptions } from '@/services/studyPlanService';
import { StudyMaterial  } from '@/services/studyMaterialService'; // Pre typ a delete
import { TopicStatus, StudyBlockStatus } from '@/types/study';

// Import nových refaktorovaných sub-komponentov
import SubjectHeader from '@/components/subjects/details/SubjectHeader';
import TopicsSection from '@/components/subjects/details/TopicsSectionDisplay';
import StudyMaterialsSection from '@/components/subjects/details/StudyMaterialsSection';
import StudyPlanSection from '@/components/subjects/details/StudyPlanSection';

// Shadcn/ui imports (len tie, čo sú priamo použité tu)
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle, Loader2, FileText } from "lucide-react";

// Importuj hook pre achievementy, ak ho tu chceš používať
// import { useAchievementNotifier } from '@/hooks/useAchievementNotifier';


function SubjectDetailPageContent() {
  const authContext = useContext(AuthContext);
  const params = useParams();
  const router = useRouter();
  const subjectIdParam = params.subjectId as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  
  const [isLoading, setIsLoading] = useState(true); // Hlavný loading pre predmet
  const [error, setError] = useState<string | null>(null); // Hlavná chyba stránky
  
  // const checkForNewAchievements = useAchievementNotifier(); // Ak ho tu chceš použiť

  useEffect(() => {
    if (authContext?.token && subjectIdParam) {
      const id = parseInt(subjectIdParam);
      if (isNaN(id)) { setError("Neplatné ID predmetu."); setIsLoading(false); return; }

      setIsLoading(true); setError(null); 
      setStudyPlan(null); setTopics([]); setStudyMaterials([]); // Resetuj stavy

      getSubjectById(id, authContext.token)
        .then(data => {
          setSubject(data);
          setTopics(data.topics || []);
          setStudyMaterials(data.materials || []); // Načítaj materiály z predmetu
          // Načítaj plán až po úspešnom načítaní predmetu
          getActiveStudyPlanForSubject(id, authContext.token!)
            .then(setStudyPlan)
            .catch(err => setError(prev => prev ? `${prev}\nChyba plánu: ${(err as Error).message}` : `Chyba plánu: ${(err as Error).message}`));
        })
        .catch(err => setError((err as Error).message || 'Nepodarilo sa načítať detail predmetu.'))
        .finally(() => setIsLoading(false));
    } else if (!subjectIdParam) { setError("Chýba ID predmetu."); setIsLoading(false); }
  }, [authContext?.token, subjectIdParam]);

  // Handlers pre Témy
  const handleTopicCreate = async (data: TopicCreate): Promise<Topic | void> => {
    if (!subject || !authContext?.token) return;
    return createTopicForSubject(subject.id, data, authContext.token);
    // .then(created => { checkForNewAchievements(); return created; }); // Achievement check
  };
  const handleTopicUpdate = async (id: number, data: TopicUpdate): Promise<Topic | void> => {
    if (!authContext?.token) return;
    return updateTopic(id, data, authContext.token);
    // .then(updated => { if(updated.status === TopicStatus.COMPLETED) checkForNewAchievements(); return updated; });
  };
  const handleTopicDelete = async (id: number): Promise<void> => {
    if (!authContext?.token || !subject) return;
    await deleteTopic(id, authContext.token);
    if (studyPlan && studyPlan.study_blocks.some(b => b.topic_id === id)) {
        getActiveStudyPlanForSubject(subject.id, authContext.token).then(setStudyPlan);
        // checkForNewAchievements();
    }
  };

  // Handlers pre Študijné Materiály

  // Handlers pre Študijný Plán
  const handleGenerateOrUpdatePlan = async (options?: GeneratePlanOptions) => {
    if (!authContext?.token || !subject) return;
    const planData: StudyPlanCreate = { subject_id: subject.id, name: studyPlan?.name || undefined };
    const newPlan = await generateOrGetStudyPlan(planData, authContext.token, options);
    setStudyPlan(newPlan);
    // await checkForNewAchievements();
  };
  const handleUpdateBlockStatus = async (blockId: number, newStatus: StudyBlockStatus) => {
    if (!authContext?.token || !studyPlan) return;
    const updatedBlock = await updateStudyBlock(blockId, { status: newStatus }, authContext.token);
    setStudyPlan(prev => prev ? { ...prev, study_blocks: prev.study_blocks.map(b => b.id === blockId ? {...updatedBlock, topic: b.topic} : b) } : null);
    if (newStatus === StudyBlockStatus.COMPLETED) {
      const affectedTopicId = studyPlan.study_blocks.find(b => b.id === blockId)?.topic_id;
      if (affectedTopicId) setTopics(prev => prev.map(t => t.id === affectedTopicId && t.status !== TopicStatus.COMPLETED ? { ...t, status: TopicStatus.COMPLETED } : t));
      // await checkForNewAchievements();
    }
  };
  const handleUpdateBlockNotes = async (blockId: number, notes: string | null) => {
    if (!authContext?.token || !studyPlan) return;
    const updatedBlock = await updateStudyBlock(blockId, { notes }, authContext.token);
    setStudyPlan(prev => prev ? { ...prev, study_blocks: prev.study_blocks.map(b => b.id === blockId ? {...updatedBlock, topic: b.topic} : b) } : null);
  };
  const handleUpdateBlockSchedule = async (blockId: number, newStart: Date) => {
    if (!authContext?.token || !studyPlan) return;
    const updatedBlock = await updateStudyBlock(blockId, { scheduled_at: newStart.toISOString() }, authContext.token);
    setStudyPlan(prev => prev ? { ...prev, study_blocks: prev.study_blocks.map(b => b.id === blockId ? {...updatedBlock, topic: b.topic} : b).sort((a,b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()) } : null);
  };
  const handleAssignMaterialToBlock = async (blockId: number, materialId: number | null) => {
    if (!authContext?.token || !studyPlan) return;
    const updatedBlock = await updateStudyBlock(blockId, { material_id: materialId }, authContext.token);
    const newMaterialForBlock = materialId ? studyMaterials.find(m => m.id === materialId) : null;
    setStudyPlan(prev => prev ? { ...prev, study_blocks: prev.study_blocks.map(b => b.id === blockId ? {...updatedBlock, topic: b.topic, material: newMaterialForBlock || undefined } : b) } : null);
    // await checkForNewAchievements();
  };
  
  const calculateActionableTopics = () => {
    if (!topics || topics.length === 0) return 0;
    const uncompleted = topics.filter(t => t.status !== TopicStatus.COMPLETED);
    if (!studyPlan) return uncompleted.length;
    const plannedIds = studyPlan.study_blocks.map(b => b.topic_id);
    return uncompleted.filter(t => !plannedIds.includes(t.id)).length;
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-[calc(100vh-4rem)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Načítavam...</p></div>;
  if (error && !subject) return <div className="container mx-auto p-4 text-center mt-10"><Alert variant="destructive" className="max-w-md mx-auto"><AlertCircle className="h-4 w-4" /><AlertTitle>Chyba</AlertTitle><AlertDescription>{error}</AlertDescription></Alert><Button onClick={() => router.push('/dashboard')} className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Button></div>;
  if (!subject) return <div className="container mx-auto p-4 text-center mt-10"><Alert className="max-w-md mx-auto"><FileText className="h-4 w-4" /><AlertTitle>Predmet nenájdený</AlertTitle><AlertDescription>Predmet neexistuje alebo k nemu nemáte prístup.</AlertDescription></Alert><Button onClick={() => router.push('/dashboard')} className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Button></div>;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Späť na Dashboard
        </Button>
      </div>

      {error && (<Alert variant="destructive" className="mb-6"><AlertCircle className="h-4 w-4" /><AlertTitle>Chyba</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}

      <SubjectHeader subject={subject} />

      <TopicsSection
        subjectId={subject.id}
        subjectName={subject.name}
        topics={topics}
        onTopicsUpdate={setTopics} // Priamo posielame setter
        handleTopicCreate={handleTopicCreate}
        handleTopicUpdate={handleTopicUpdate}
        handleTopicDelete={handleTopicDelete}
      />
      
      <StudyMaterialsSection
        subjectId={subject.id}
        initialMaterials={studyMaterials} // Posielame počiatočné materiály
      />

      <StudyPlanSection
        studyPlan={studyPlan}
        isLoadingPlan={isLoading} // isLoadingPlan by mal byť samostatný, nie hlavný isLoading
        planError={error} // planError by mal byť samostatný
        actionableTopicsCount={calculateActionableTopics()}
        onGenerateOrUpdatePlan={handleGenerateOrUpdatePlan}
        onUpdateBlockStatus={handleUpdateBlockStatus}
        onUpdateBlockNotes={handleUpdateBlockNotes}
        onUpdateBlockSchedule={handleUpdateBlockSchedule}
        onAssignMaterialToBlock={handleAssignMaterialToBlock}
        isProcessingBlockAction={isLoading} // isProcessingBlockAction by mal byť    </div>
  );
}

export default function SubjectDetailPage() {
  return (
    <ProtectedRoute>
      <SubjectDetailPageContent />
    </ProtectedRoute>
  );
}