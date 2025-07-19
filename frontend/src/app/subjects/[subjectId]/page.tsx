"use client"

import { useParams } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useSubjectDetail } from "@/hooks/useSubjectDetail"
import { useAuth } from "@/hooks/useAuth"
import SubjectHeader from "@/components/subjects/subjectPage/SubjectHeader"
import SubjectOverview from "@/components/subjects/subjectPage/SubjectOverview"
import TopicsSection from "@/components/subjects/topics/TopicsSection"
import StudyPlanSection from "@/components/subjects/subjectPage/StudyPlanSection"
import MaterialsSection from "@/components/subjects/materials/MaterialsSection"
import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const SubjectDetailPageContent = () => {
  const { subjectId } = useParams<{ subjectId: string }>()
  const id = Number(subjectId)
  const { token } = useAuth()
  const data = useSubjectDetail(id, token)

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] p-4">
          <div className="text-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground text-xl">Načítavam predmet...</p>
          </div>
        </div>
      </div>
    )
  }

  if (data.error || !data.subject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="container mx-auto px-4 py-8">
          <SubjectHeader error={data.error} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-60 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-2xl" />
      </div>

      {/* Header Section */}
      <section className="relative z-10 border-b border-border/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 max-w-7xl">
          <SubjectHeader />
        </div>
      </section>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl">
          {/* Overview Section - Full Width */}
          <section className="mb-12">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <SubjectOverview subject={data.subject} />
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left Column - Topics and Study Plan */}
            <div className="xl:col-span-8 space-y-8">
              {/* Topics Section */}
              <section className="animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
                <Card className="border-muted/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl">
                  <CardContent className="p-0">
                    <TopicsSection
                      subjectId={id}
                      topics={data.topics}
                      upsertTopic={data.upsertTopic}
                      removeTopic={data.removeTopic}
                      subjectName={data.subject.name}
                    />
                  </CardContent>
                </Card>
              </section>

              {/* Study Plan Section */}
              <section className="animate-in fade-in slide-in-from-left-4 duration-700 delay-400">
                <Card className="border-muted/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl">
                  <CardContent className="p-0">
                    <StudyPlanSection
                      studyPlan={data.studyPlan}
                      actionableTopics={data.actionableTopics}
                      loading={data.planLoading}
                      error={data.planError}
                      onGenerate={data.generatePlan}
                      onUpdateBlock={(id, upd) => data.updateBlock(id, upd as never)}
                    />
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Right Column - Materials Sidebar */}
            <div className="xl:col-span-4">
              <div className="sticky top-8">
                <section className="animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
                  <Card className="border-muted/40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xl">
                    <CardContent className="p-0">
                      <MaterialsSection
                        subjectId={id}
                        token={token}
                        materials={data.materials}
                        isLoading={data.matsLoading}
                        error={data.matError}
                        onUpload={data.uploadSuccess}
                        onDelete={data.removeMaterial}
                      />
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </div>

          {/* Bottom Spacer */}
          <div className="h-16" />
        </div>
      </div>

      {/* Floating Elements */}
      <div className="fixed bottom-8 right-8 pointer-events-none">
        <div className="w-2 h-2 bg-primary/30 rounded-full animate-ping" />
      </div>
      <div className="fixed top-1/4 left-8 pointer-events-none">
        <div className="w-1 h-1 bg-secondary/40 rounded-full animate-pulse" />
      </div>
    </div>
  )
}

export default function SubjectDetailPage() {
  return (
    <ProtectedRoute>
      <SubjectDetailPageContent />
    </ProtectedRoute>
  )
}
