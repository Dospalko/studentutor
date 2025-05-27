// frontend/src/hooks/useSubjectData.ts
"use client";

import { useState, useEffect, useCallback, useContext } from 'react';
import { getSubjectById, Subject } from '@/services/subjectService';
import { 
    Topic, TopicCreate, TopicUpdate, 
    createTopicForSubject, updateTopic, deleteTopic 
} from '@/services/topicService';
import { AuthContext } from '@/context/AuthContext';
import { StudyPlan } from '@/services/studyPlanService'; // Potrebné pre refetch plánu

interface UseSubjectDataProps {
  subjectIdParam: string | undefined;
  studyPlan: StudyPlan | null; // Pre refetch plánu po zmazaní témy
  setStudyPlan: React.Dispatch<React.SetStateAction<StudyPlan | null>>; // Pre refetch plánu
  // Pridaj aj funkciu na refetch plánu z useStudyPlanData, ak je to čistejšie
  refetchStudyPlan: (subjectId: number) => Promise<void>;
}

export function useSubjectData({ subjectIdParam, studyPlan, setStudyPlan, refetchStudyPlan }: UseSubjectDataProps) {
  const authContext = useContext(AuthContext);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoadingSubject, setIsLoadingSubject] = useState(true);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

  const fetchSubjectDetails = useCallback(async () => {
    if (authContext?.token && subjectIdParam) {
      const id = parseInt(subjectIdParam);
      if (isNaN(id)) {
        setSubjectError("Neplatné ID predmetu.");
        setIsLoadingSubject(false);
        return;
      }
      setIsLoadingSubject(true);
      setSubjectError(null);
      try {
        const data = await getSubjectById(id, authContext.token);
        setSubject(data);
        setTopics(data.topics || []);
      } catch (err) {
        console.error("Error fetching subject details:", err);
        setSubjectError((err as Error).message || 'Nepodarilo sa načítať detail predmetu.');
      } finally {
        setIsLoadingSubject(false);
      }
    } else if (!subjectIdParam) {
        setSubjectError("Chýba ID predmetu.");
        setIsLoadingSubject(false);
    }
  }, [authContext?.token, subjectIdParam]);

  useEffect(() => {
    fetchSubjectDetails();
  }, [fetchSubjectDetails]);

  const handleOpenNewTopicDialog = () => {
    setEditingTopic(null);
    setIsTopicDialogOpen(true);
  };

  const handleOpenEditTopicDialog = (topic: Topic) => {
    setEditingTopic(topic);
    setIsTopicDialogOpen(true);
  };

  const handleTopicFormSubmit = async (data: TopicCreate | TopicUpdate, editingTopicId?: number) => {
    if (!authContext?.token || !subject) return;
    setIsSubmittingTopic(true);
    setSubjectError(null); // Reset chyby predtým

    try {
      if (editingTopicId && editingTopic) {
        const updated = await updateTopic(editingTopicId, data as TopicUpdate, authContext.token);
        setTopics(prev => prev.map(t => t.id === updated.id ? updated : t).sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const created = await createTopicForSubject(subject.id, data as TopicCreate, authContext.token);
        setTopics(prev => [created, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setIsTopicDialogOpen(false);
    } catch (err: unknown) {
      console.error("Error submitting topic:", err);
      setSubjectError(err instanceof Error ? err.message : (editingTopicId ? 'Nepodarilo sa aktualizovať tému.' : 'Nepodarilo sa vytvoriť tému.'));
    } finally {
      setIsSubmittingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!authContext?.token || !subject) return;
    if (!window.confirm('Naozaj chcete zmazať túto tému? Jej bloky budú tiež odstránené z aktívneho plánu (ak existujú).')) return;
    
    setSubjectError(null);
    try {
      await deleteTopic(topicId, authContext.token);
      setTopics(prev => prev.filter(t => t.id !== topicId));
      // Ak bola zmazaná téma v pláne, je dobré plán znova načítať
      if (studyPlan && studyPlan.study_blocks.some(b => b.topic_id === topicId)) {
        console.log("Topic deleted was in plan, refetching plan...");
        await refetchStudyPlan(subject.id);
      }
    } catch (err: unknown) {
      console.error("Error deleting topic:", err);
      setSubjectError(err instanceof Error ? err.message : "Nepodarilo sa zmazať tému.");
    }
  };

  return {
    subject,
    topics,
    isLoadingSubject,
    subjectError,
    isTopicDialogOpen,
    editingTopic,
    isSubmittingTopic,
    setIsTopicDialogOpen, // Aby rodič mohol meniť (aj keď TopicFormDialog to už robí)
    setEditingTopic,    // Ak by bolo potrebné externe
    handleOpenNewTopicDialog,
    handleOpenEditTopicDialog,
    handleTopicFormSubmit,
    handleDeleteTopic,
    fetchSubjectDetails // Pre prípadný manuálny refetch
  };
}