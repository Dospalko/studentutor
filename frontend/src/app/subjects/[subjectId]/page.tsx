"use client";

import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSubjectDetail } from "@/hooks/useSubjectDetail";
import { useAuth } from "@/hooks/useAuth";

import SubjectHeader from "@/components/subjects/subjectPage/SubjectHeader";
import SubjectOverview from "@/components/subjects/subjectPage/SubjectOverview";
import TopicsSection from "@/components/subjects/topics/TopicsSection";
import StudyPlanSection from "@/components/subjects/subjectPage/StudyPlanSection";
import MaterialsSection from "@/components/subjects/materials/MaterialsSection";

const SubjectDetailPageContent = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const id = Number(subjectId);

  const { token } = useAuth();           // ✅ žiadny optional chaining
  const data = useSubjectDetail(id, token);

  if (data.loading) return <p className="text-center py-20">Načítavam…</p>;
  if (data.error || !data.subject) return <SubjectHeader error={data.error} />;

  return (
    <div className="container mx-auto px-4 py-8">
      <SubjectHeader />

      <SubjectOverview subject={data.subject} />

      <TopicsSection
        subjectId={id}
        topics={data.topics}
        upsertTopic={data.upsertTopic}
        removeTopic={data.removeTopic}
        subjectName={data.subject.name}
      />

      <StudyPlanSection
        studyPlan={data.studyPlan}
        actionableTopics={data.actionableTopics}
        loading={data.planLoading}
        error={data.planError}
        onGenerate={data.generatePlan}
        onUpdateBlock={(id, upd) => data.updateBlock(id, upd as never)}
      />

      <MaterialsSection
        subjectId={id}
        token={token}
        materials={data.materials}
        isLoading={data.matsLoading}
        error={data.matError}
        onUpload={data.uploadSuccess}
        onDelete={data.removeMaterial}
      />
    </div>
  );
};

export default function SubjectDetailPage() {
  return (
    <ProtectedRoute>
      <SubjectDetailPageContent />
    </ProtectedRoute>
  );
}
