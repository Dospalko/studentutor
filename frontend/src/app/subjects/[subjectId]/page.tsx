"use client";

import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSubjectDetail } from "@/hooks/useSubjectDetail";
import { useAuth } from "@/hooks/useAuth";
import SubjectOverview from "@/components/subjects/subjectPage/SubjectOverview";
import TopicsSection from "@/components/subjects/topics/TopicsSection";
import StudyPlanSection from "@/components/subjects/subjectPage/StudyPlanSection";
import MaterialsSection from "@/components/subjects/materials/MaterialsSection";
import FloatingSidebar from "@/components/subjects/layout/FloatingSidebar";
import BackgroundEffects from "@/components/subjects/layout/BackgroundEffects";
import LoadingScreen from "@/components/subjects/layout/LoadingScreen";
import ErrorScreen from "@/components/subjects/layout/ErrorScreen";
import TopNavigation from "@/components/subjects/layout/TopNavigation";
import SectionHeader from "@/components/subjects/layout/SectionHeader";
import ContentSection from "@/components/subjects/layout/ContentSection";
import { BarChart3, Calendar, Target, Zap } from "lucide-react";
import { TopicStatus } from "@/types/study";
import { useState, useEffect } from "react";
const SubjectDetailPageContent = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const id = Number(subjectId);
  const { token } = useAuth();
  const data = useSubjectDetail(id, token);

  const [minLoading, setMinLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setMinLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (data.loading || minLoading) {
    return (
      <div>
        <BackgroundEffects />
        <LoadingScreen />
      </div>
    );
  }

  if (data.error || !data.subject) {
    return (
      <div>
        <BackgroundEffects />
        <ErrorScreen error={data.error} />
      </div>
    );
  }

  const { subject } = data;
  const totalTopics = subject.topics?.length || 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedTopics =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subject.topics?.filter((t: any) => t.status === TopicStatus.COMPLETED)
      .length || 0;
  const progressPercentage =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const isCompleted = progressPercentage === 100;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundEffects />
      <FloatingSidebar />

      <TopNavigation
        subject={subject}
        completedTopics={completedTopics}
        totalTopics={totalTopics}
        progressPercentage={progressPercentage}
        isCompleted={isCompleted}
      />

      <main className="w-full relative z-10">
        {/* Overview Section */}
        <ContentSection id="overview">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/40 to-transparent dark:via-blue-900/20 rounded-3xl" />
          <SectionHeader
            icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
            badge="Prehľad Predmetu"
            title="Váš študijný pokrok"
            description="Komplexný pohľad na všetky aspekty vášho štúdia, štatistiky a dosiahnuté míľniky"
            badgeColor="text-blue-600"
          />
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className=" text-center  dark:bg-black/10 rounded-3xl  p-4">
              <SubjectOverview subject={subject} />
            </div>
          </div>
        </ContentSection>

        {/* Topics Section */}
        <ContentSection id="topics">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/40 to-transparent dark:via-green-900/20 rounded-3xl" />
          <SectionHeader
            icon={<Target className="h-8 w-8 text-green-600" />}
            badge="Témy a Obsah"
            title="Organizujte svoje témy"
            description="Spravujte obsah predmetu, sledujte pokrok jednotlivých tém a udržujte si prehľad"
            badgeColor="text-green-600"
          />
          <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <TopicsSection
                subjectId={id}
                topics={data.topics}
                upsertTopic={data.upsertTopic}
                removeTopic={data.removeTopic}
                subjectName={subject.name}
              />
            </div>
          </div>
        </ContentSection>

        {/* Study Plan Section */}
        <ContentSection id="plan">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-indigo-50/20 to-blue-50/30 dark:from-purple-900/20 dark:via-indigo-900/10 dark:to-blue-900/20 rounded-3xl" />
          <SectionHeader
            icon={<Calendar className="h-8 w-8 text-purple-600" />}
            badge="AI Študijný Plán"
            title="Inteligentný plán štúdia"
            description="Nechajte AI vytvoriť personalizovaný študijný plán prispôsobený vašim potrebám a tempu učenia"
            badgeColor="text-purple-600"
          />
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <div className="group relative backdrop-blur-xl bg-gradient-to-br from-white/20 via-white/10 to-white/5 dark:from-black/20 dark:via-black/10 dark:to-black/5 rounded-3xl border border-white/30 dark:border-white/10 shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500">
              {/* Gradient overlay for extra depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Subtle animated border */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

              <div className="relative z-10">
                <StudyPlanSection
                  studyPlan={data.studyPlan}
                  actionableTopics={data.actionableTopics}
                  loading={data.planLoading}
                  error={data.planError}
                  onGenerate={data.generatePlan}
                  onUpdateBlock={(id, upd) =>
                    data.updateBlock(id, upd as never)
                  }
                />
              </div>
            </div>
          </div>
        </ContentSection>
        {/* Materials Section */}
        <ContentSection id="materials">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/40 to-transparent dark:via-amber-900/20 rounded-3xl" />
          <SectionHeader
            icon={<Zap className="h-8 w-8 text-amber-600" />}
            badge="Študijné Materiály"
            title="Vaše materiály"
            description="Centralizované úložisko pre všetky vaše študijné materiály s pokročilým vyhľadávaním"
            badgeColor="text-amber-600"
          />
          <div className="animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
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
          </div>
        </ContentSection>
      </main>

      {/* Enhanced Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-3 bg-black/20 dark:bg-white/20 backdrop-blur-sm z-30 border-t border-white/10">
        <div
          className="h-full bg-gradient-to-r from-primary via-secondary to-primary shadow-xl transition-all duration-1000 ease-out relative overflow-hidden"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
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
