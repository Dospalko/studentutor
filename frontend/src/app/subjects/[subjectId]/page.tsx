// frontend/src/app/subjects/[subjectId]/page.tsx
"use client";

import { useContext } from 'react'; // Odstránené useEffect, useState, FormEvent
import { useParams, useRouter } from 'next/navigation'; // useRouter môže zostať pre navigačné tlačidlo
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthContext } from '@/context/AuthContext'; // Potrebné pre hooky
import { TopicStatus } from '@/types/study'; // Potrebné pre onTopicStatusChange

// Import hookov
import { useSubjectData } from '@/hooks/useSubjectData';
import { useStudyPlanData } from '@/hooks/useStudyPlanData';

// Import sub-komponentov
import SubjectHeader from '@/components/subjects/SubjectHeader';
import TopicSection from '@/components/subjects/TopicSection';
import StudyPlanSection from '@/components/subjects/StudyPlanSection';
import StudyBlockDetailDialog from '@/components/subjects/StudyBlockDetailDialog'; // Ak ho používaš

// Shadcn/ui imports (len tie, čo sú priamo použité tu)
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button'; // Pre navigačné tlačidlo
import { ArrowLeft, AlertCircle, Loader2, FileText } from "lucide-react";

function SubjectDetailPageContent() {
  const authContext = useContext(AuthContext); // Potrebný pre hooky
  const params = useParams();
  const router = useRouter(); // Pre tlačidlo späť
  const subjectIdParam = params.subjectId as string;

  // --- Použitie Custom Hookov ---
  const {
    studyPlan,
    isLoadingPlan: isLoadingActivePlan, // Prejmenuj, aby sa odlíšilo od isLoadingSubject
    planError: activePlanError,
    showCalendarView,
    setShowCalendarView,
    selectedBlock,
    isBlockDetailOpen,
    setIsBlockDetailOpen,
    isUpdatingBlockDetail,
    handleGenerateOrUpdatePlan,
    handleUpdateBlockStatus,
    handleUpdateBlockNotes,
    handleCalendarEventSelect,
    calculateActionableTopicsCount,
    fetchActiveStudyPlan
  } = useStudyPlanData({ 
    subjectId: subjectIdParam ? parseInt(subjectIdParam) : null, // Poskytni ID alebo null
    subjectName: undefined, // Názov predmetu sa načíta v useSubjectData
    topics: [], // Počiatočný prázdny zoznam, hook si ho naplní
    // Callback na aktualizáciu globálneho zoznamu tém (bude potrebovať prepojenie s useSubjectData)
    onTopicStatusChange: (topicId: number, newStatus: TopicStatus) => {
        // Táto funkcia by mala byť v useSubjectData a aktualizovať `topics` stav
        // Tu by si ju zavolal, ak by ju useStudyPlanData exportoval ako prop.
        // Pre teraz to zjednodušíme a necháme optimistický update v useStudyPlanData.
        // Ak by si chcel, aby sa témy v TopicList okamžite prefarbili, potrebuješ
        // zdieľať stav tém medzi hookmi alebo mať globálny stav (napr. Zustand, Redux).
        // Alebo jednoducho fetchSubjectDetails znova.
        console.log(`Topic ${topicId} status changed to ${newStatus} by plan action.`);
        // subjectData.setTopics(prev => prev.map(t => t.id === topicId ? {...t, status: newStatus} : t));
        subjectData.fetchSubjectDetails(); // Jednoduchší refetch tém
    }
  });

  const subjectData = useSubjectData({ 
    subjectIdParam,
    studyPlan, // studyPlan z useStudyPlanData
    setStudyPlan, // setStudyPlan z useStudyPlanData (pre refetch plánu v useSubjectData)
    refetchStudyPlan: (id: number) => fetchActiveStudyPlan(id) // Poskytni funkciu na refetch
  });

  // --- Stavy pre UI (Loading, Error, Not Found) ---
  // Hlavné načítavanie je teraz isLoadingSubject
  if (!authContext?.token || (!authContext?.user && subjectData.isLoadingSubject)) {
    return (<div className="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Načítavam...</p></div>);
  }
  if (subjectData.isLoadingSubject) {
    return (<div className="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] p-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-muted-foreground">Načítavam detail predmetu...</p></div>);
  }
  if (subjectData.subjectError && !subjectData.subject) {
    return (<div className="container mx-auto p-4 text-center mt-10"><Alert variant="destructive" className="max-w-md mx-auto"><AlertCircle className="h-4 w-4" /><AlertTitle>Chyba</AlertTitle><AlertDescription>{subjectData.subjectError}</AlertDescription></Alert><Button onClick={() => router.push('/dashboard')} className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Späť na Dashboard</Button></div>);
  }
  if (!subjectData.subject) {
    return (<div className="container mx-auto p-4 text-center mt-10"><Alert className="max-w-md mx-auto"><FileText className="h-4 w-4" /><AlertTitle>Predmet nenájdený</AlertTitle><AlertDescription>Zdá sa, že tento predmet neexistuje alebo k nemu nemáte prístup.</AlertDescription></Alert><Button onClick={() => router.push('/dashboard')} className="mt-6"><ArrowLeft className="mr-2 h-4 w-4" /> Späť na Dashboard</Button></div>);
  }

  // Aby sme mohli poslať aktuálny subjectName do useStudyPlanData (ak by sme ho nemenili priamo)
  // useEffect(() => {
  //   if (subjectData.subject?.name) {
  //     // setSubjectNameForPlanHook(subjectData.subject.name); // Hypotetická funkcia v hooku
  //   }
  // }, [subjectData.subject?.name]);
  // Ale je jednoduchšie, ak si StudyPlanSection berie subjectName priamo z `subjectData.subject.name`

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <SubjectHeader subject={subjectData.subject} />
      
      <TopicSection
        topics={subjectData.topics}
        subjectName={subjectData.subject?.name}
        error={subjectData.subjectError} // Chyby z useSubjectData (pre témy)
        isDialogOpen={subjectData.isTopicDialogOpen}
        editingTopic={subjectData.editingTopic}
        isSubmitting={subjectData.isSubmittingTopic}
        onOpenChangeDialog={subjectData.setIsTopicDialogOpen}
        onOpenNewDialog={subjectData.handleOpenNewTopicDialog}
        onOpenEditDialog={subjectData.handleOpenEditTopicDialog}
        onSubmitForm={subjectData.handleTopicFormSubmit}
        onDeleteTopic={subjectData.handleDeleteTopic}
      />
      
      <StudyPlanSection
        subjectName={subjectData.subject?.name}
        studyPlan={studyPlan}
        isLoadingPlan={isLoadingActivePlan}
        planError={activePlanError}
        showCalendarView={showCalendarView}
        onToggleView={setShowCalendarView}
        actionableTopicsCount={calculateActionableTopicsCount()} // Vypočítané pomocou tém z subjectData a plánu z studyPlanData
        onGenerateOrUpdatePlan={handleGenerateOrUpdatePlan}
        onUpdateBlockStatus={handleUpdateBlockStatus}
        onCalendarEventSelect={handleCalendarEventSelect}
      />

      {/* Dialóg pre detail študijného bloku */}
      <StudyBlockDetailDialog
          block={selectedBlock}
          isOpen={isBlockDetailOpen}
          onOpenChange={setIsBlockDetailOpen}
          onUpdateStatus={handleUpdateBlockStatus} // Môže byť rovnaký ako pre zoznam
          onUpdateNotes={handleUpdateBlockNotes}
          isUpdating={isUpdatingBlockDetail || isLoadingActivePlan}
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