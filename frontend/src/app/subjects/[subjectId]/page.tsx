"use client"

import { useParams } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useSubjectDetail } from "@/hooks/useSubjectDetail"
import { useAuth } from "@/hooks/useAuth"
import SubjectOverview from "@/components/subjects/subjectPage/SubjectOverview"
import TopicsSection from "@/components/subjects/topics/TopicsSection"
import StudyPlanSection from "@/components/subjects/subjectPage/StudyPlanSection"
import MaterialsSection from "@/components/subjects/materials/MaterialsSection"
import { Loader2, ArrowLeft, BookOpen, Target, Calendar, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TopicStatus } from "@/types/study"

const SubjectDetailPageContent = () => {
  const { subjectId } = useParams<{ subjectId: string }>()
  const id = Number(subjectId)
  const { token } = useAuth()
  const data = useSubjectDetail(id, token)

  if (data.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-xl">Načítavam predmet...</p>
        </div>
      </div>
    )
  }

  if (data.error || !data.subject) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-destructive mb-2">Predmet sa nenašiel</h2>
            <p className="text-muted-foreground mb-6">{data.error || "Nepodarilo sa načítať predmet"}</p>
            <Link href="/dashboard">
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Späť na Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { subject } = data
  const totalTopics = subject.topics?.length || 0
  const completedTopics = subject.topics?.filter((t: any) => t.status === TopicStatus.COMPLETED).length || 0
  const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Sidebar Navigation */}
      <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-50 hidden lg:block">
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-border/50">
          <div className="flex flex-col gap-3">
            {[
              { id: "overview", icon: BarChart3, label: "Prehľad", color: "text-blue-600" },
              { id: "topics", icon: Target, label: "Témy", color: "text-green-600" },
              { id: "plan", icon: Calendar, label: "Plán", color: "text-purple-600" },
              { id: "materials", icon: FileText, label: "Materiály", color: "text-amber-600" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className="group relative w-12 h-12 rounded-xl bg-background hover:bg-primary/10 flex items-center justify-center transition-all duration-200 hover:scale-110 border border-border/50 hover:border-primary/30"
                  title={item.label}
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })}
                >
                  <Icon className={`h-5 w-5 ${item.color} group-hover:text-primary transition-colors`} />
                  <div className="absolute right-full mr-3 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {item.label}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold">
                  {subject.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{subject.name}</h1>
                  <p className="text-sm text-muted-foreground">Študijný predmet</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-2">
                <Target className="h-3 w-3" />
                {completedTopics}/{totalTopics} tém
              </Badge>
              <Badge variant="outline" className="gap-2">
                <BarChart3 className="h-3 w-3" />
                {progressPercentage}% pokrok
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Fullscreen */}
      <div className="w-full">
        {/* Overview Section - Fullscreen */}
        <section id="overview" className="min-h-screen flex items-center justify-center scroll-mt-20 py-12">
          <div className="w-full max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">Prehľad Predmetu</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Celkový pohľad na váš pokrok, štatistiky a kľúčové informácie o predmete
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <SubjectOverview subject={subject} />
            </div>
          </div>
        </section>

        {/* Topics Section - Fullscreen */}
        <section id="topics" className="min-h-screen flex items-center justify-center scroll-mt-20 py-12 bg-muted/30">
          <div className="w-full max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">Témy a Obsah</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Spravujte témy, sledujte pokrok a organizujte obsah vášho predmetu
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
              <div className="bg-background rounded-2xl border border-border shadow-xl">
                <TopicsSection
                  subjectId={id}
                  topics={data.topics}
                  upsertTopic={data.upsertTopic}
                  removeTopic={data.removeTopic}
                  subjectName={subject.name}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Study Plan Section - Fullscreen */}
        <section id="plan" className="min-h-screen flex items-center justify-center scroll-mt-20 py-12">
          <div className="w-full max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">Študijný Plán</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Vytvorte a sledujte svoj personalizovaný študijný plán s AI asistentom
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-background rounded-2xl border border-border shadow-xl">
                <StudyPlanSection
                  studyPlan={data.studyPlan}
                  actionableTopics={data.actionableTopics}
                  loading={data.planLoading}
                  error={data.planError}
                  onGenerate={data.generatePlan}
                  onUpdateBlock={(id, upd) => data.updateBlock(id, upd as never)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Materials Section - Fullscreen */}
        <section
          id="materials"
          className="min-h-screen flex items-center justify-center scroll-mt-20 py-12 bg-muted/30"
        >
          <div className="w-full max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-4">Študijné Materiály</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Nahrajte, organizujte a spravujte všetky vaše študijné materiály na jednom mieste
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="bg-background rounded-2xl border border-border shadow-xl max-w-4xl mx-auto">
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
          </div>
        </section>
      </div>

      {/* Progress Indicator */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-muted/50 z-30">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
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
