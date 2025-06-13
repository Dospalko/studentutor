// src/hooks/useSubjectDetail.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSubjectById,
  Subject,
} from "@/services/subjectService";
import {
  Topic,
  TopicCreate,
  TopicUpdate,
  createTopicForSubject,
  updateTopic,
  deleteTopic,
} from "@/services/topicService";
import {
  StudyPlan,
  StudyBlock,
  StudyBlockUpdate,
  generateOrGetStudyPlan,
  getActiveStudyPlanForSubject,
  updateStudyBlock,
  GeneratePlanOptions,
} from "@/services/studyPlanService";
import {
  StudyMaterial,
  getStudyMaterialsForSubject,
  deleteStudyMaterial,
} from "@/services/studyMaterialService";
import {
  TopicStatus,
} from "@/types/study";

/**
 * Vráti všetky dáta + akcie, ktoré page potrebuje.
 * Tým pádom samotná stránka len tlačí UI.
 */
export const useSubjectDetail = (
  subjectId: number,
  token: string | null
) => {
  // ---------- STATE ----------
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics]   = useState<Topic[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<StudyBlock | null>(null);

  // UI flags
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [matsLoading, ] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [matError, setMatError] = useState<string | null>(null);

  // ---------- FETCH ----------
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getSubjectById(subjectId, token)
      .then((data) => {
        setSubject(data);
        setTopics(data.topics || []);
        return Promise.all([
          getActiveStudyPlanForSubject(subjectId, token)
            .then(setStudyPlan)
            .catch((e) =>
              setPlanError(e instanceof Error ? e.message : "Chyba plánu")
            ),
          getStudyMaterialsForSubject(subjectId, token)
            .then(setMaterials)
            .catch((e) =>
              setMatError(e instanceof Error ? e.message : "Chyba materiálov")
            ),
        ]);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Chyba načítania predmetu")
      )
      .finally(() => setLoading(false));
  }, [subjectId, token]);

  // ---------- MUTATIONS ----------
  const upsertTopic = useCallback(
    async (data: TopicCreate | TopicUpdate, id?: number) => {
      if (!token) return;
      return id
        ? updateTopic(id, data as TopicUpdate, token).then((upd) =>
            setTopics((prev) =>
              prev.map((t) => (t.id === upd.id ? upd : t)).sort(sortByName)
            )
          )
        : createTopicForSubject(subjectId, data as TopicCreate, token).then(
            (created) =>
              setTopics((prev) => [created, ...prev].sort(sortByName))
          );
    },
    [subjectId, token]
  );

  const removeTopic = useCallback(
    async (topicId: number) => {
      if (!token) return;
      await deleteTopic(topicId, token);
      setTopics((prev) => prev.filter((t) => t.id !== topicId));
      // ak plán obsahoval bloky danej témy, načítaj plán znova
      if (studyPlan?.study_blocks.some((b) => b.topic_id === topicId)) {
        const refreshed = await getActiveStudyPlanForSubject(subjectId, token);
        setStudyPlan(refreshed);
      }
    },
    [subjectId, token, studyPlan]
  );

  const generatePlan = useCallback(
    async (opts?: GeneratePlanOptions) => {
      if (!token) return;
      setPlanLoading(true);
      try {
        const newPlan = await generateOrGetStudyPlan(
          { subject_id: subjectId, name: studyPlan?.name },
          token,
          opts
        );
        setStudyPlan(newPlan);
      } catch (e) {
        setPlanError(
          e instanceof Error ? e.message : "Nepodarilo sa vygenerovať plán"
        );
      } finally {
        setPlanLoading(false);
      }
    },
    [subjectId, token, studyPlan?.name]
  );

  const updateBlock = useCallback(
    async (id: number, data: StudyBlockUpdate) => {
      if (!token) return;
      const updated = await updateStudyBlock(id, data, token);
      setStudyPlan((prev) =>
        prev
          ? {
              ...prev,
              study_blocks: prev.study_blocks.map((b) =>
                b.id === id ? { ...updated, topic: b.topic } : b
              ),
            }
          : prev
      );
    },
    [token]
  );

  const uploadSuccess = (mat: StudyMaterial) =>
    setMaterials((prev) => [mat, ...prev]);

  const removeMaterial = useCallback(
    async (id: number) => {
      if (!token) return;
      await deleteStudyMaterial(id, token);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    },
    [token]
  );

  // ---------- HELPERS ----------
  const actionableTopics = topics.filter(
    (t) =>
      t.status !== TopicStatus.COMPLETED &&
      !studyPlan?.study_blocks.some((b) => b.topic_id === t.id)
  ).length;

  return {
    // data
    subject,
    topics,
    studyPlan,
    materials,
    selectedBlock,
    actionableTopics,
    // ui
    loading,
    planLoading,
    matsLoading,
    error,
    planError,
    matError,
    // actions
    setSelectedBlock,
    upsertTopic,
    removeTopic,
    generatePlan,
    updateBlock,
    uploadSuccess,
    removeMaterial,
  };
};

// malé util-ky ----- //
const sortByName = (a: Topic, b: Topic) => a.name.localeCompare(b.name);
