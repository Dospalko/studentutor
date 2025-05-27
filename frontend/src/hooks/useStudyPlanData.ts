// frontend/src/hooks/useStudyPlanData.ts
"use client";

import { useState, useEffect, useCallback, useContext } from 'react';
import { 
    StudyPlan, StudyBlock, StudyPlanCreate, StudyBlockUpdate, 
    generateOrGetStudyPlan, getActiveStudyPlanForSubject, updateStudyBlock, 
    GeneratePlanOptions 
} from '@/services/studyPlanService';
import { StudyBlockStatus, TopicStatus } from '@/types/study';
import { AuthContext } from '@/context/AuthContext';
import { Topic } from '@/services/topicService'; // Potrebné pre topics v Subject

interface UseStudyPlanDataProps {
  subjectId: number | null; // ID aktuálneho predmetu
  subjectName: string | undefined;
  topics: Topic[]; // Zoznam tém pre výpočet actionableTopicsCount
  // Callback na aktualizáciu globálneho zoznamu tém, ak sa status témy zmení
  onTopicStatusChange: (topicId: number, newStatus: TopicStatus) => void; 
}

export function useStudyPlanData({ subjectId, subjectName, topics, onTopicStatusChange }: UseStudyPlanDataProps) {
  const authContext = useContext(AuthContext);

  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false); // Zmenené z isFetchingPlan
  const [planError, setPlanError] = useState<string | null>(null);
  const [showCalendarView, setShowCalendarView] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<StudyBlock | null>(null);
  const [isBlockDetailOpen, setIsBlockDetailOpen] = useState(false);
  const [isUpdatingBlockDetail, setIsUpdatingBlockDetail] = useState(false);


  const fetchActiveStudyPlan = useCallback(async (currentSubjectId: number) => {
    if (authContext?.token) {
      setIsLoadingPlan(true);
      setPlanError(null);
      try {
        const planData = await getActiveStudyPlanForSubject(currentSubjectId, authContext.token);
        setStudyPlan(planData);
      } catch (err) {
        console.error("Error fetching study plan:", err);
        setPlanError((err as Error).message || 'Nepodarilo sa načítať študijný plán.');
      } finally {
        setIsLoadingPlan(false);
      }
    }
  }, [authContext?.token]);

  useEffect(() => {
    if (subjectId) {
      fetchActiveStudyPlan(subjectId);
    } else {
      setStudyPlan(null); // Ak nie je subjectId, resetuj plán
    }
  }, [subjectId, fetchActiveStudyPlan]);


  const handleGenerateOrUpdatePlan = async (options?: GeneratePlanOptions) => {
    if (!authContext?.token || !subjectId) return;
    setIsLoadingPlan(true); setPlanError(null);
    
    const planData: StudyPlanCreate = { 
        subject_id: subjectId,
        name: studyPlan?.name || (subjectName ? `Plán pre ${subjectName}` : undefined)
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

  const handleUpdateBlockStatus = async (blockId: number, newStatus: StudyBlockStatus) => {
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
            onTopicStatusChange(affectedTopicId, TopicStatus.COMPLETED);
        }
      }
    } catch (err) {
      console.error("Error updating study block:", err);
      setPlanError((err as Error).message || 'Nepodarilo sa aktualizovať študijný blok.');
      setStudyPlan(prev => prev ? { ...prev, study_blocks: originalBlocks } : null);
    }
  };
  
  const handleUpdateBlockNotes = async (blockId: number, notes: string) => {
    if (!authContext?.token || !studyPlan) return;
    setIsUpdatingBlockDetail(true);
    setPlanError(null);

    const blockData: StudyBlockUpdate = { notes: notes };
    try {
        const updatedBlockResponse = await updateStudyBlock(blockId, blockData, authContext.token);
        setStudyPlan(prevPlan => {
            if (!prevPlan) return null;
            const newBlocks = prevPlan.study_blocks.map(b =>
                b.id === updatedBlockResponse.id 
                ? { ...updatedBlockResponse, topic: studyPlan.study_blocks.find(ob => ob.topic_id === updatedBlockResponse.topic_id)?.topic || b.topic } 
                : b
            );
            return { ...prevPlan, study_blocks: newBlocks };
        });
        setSelectedBlock(prev => prev && prev.id === blockId ? {...prev, notes: updatedBlockResponse.notes} : prev);
    } catch (err) {
        console.error("Error updating block notes:", err);
        setPlanError((err as Error).message || 'Nepodarilo sa aktualizovať poznámky bloku.');
    } finally {
        setIsUpdatingBlockDetail(false);
    }
  };


  const handleCalendarEventSelect = (calendarEvent: { resource?: StudyBlock }) => {
    if (calendarEvent.resource) {
        setSelectedBlock(calendarEvent.resource);
        setIsBlockDetailOpen(true);
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

  return {
    studyPlan,
    isLoadingPlan,
    planError,
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
    fetchActiveStudyPlan // Exportuj pre refetch z useSubjectData
  };
}