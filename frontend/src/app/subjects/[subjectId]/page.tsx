"use client"

import { useParams } from "next/navigation"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useSubjectDetail } from "@/hooks/useSubjectDetail"
import { useAuth } from "@/hooks/useAuth"
import SubjectOverview from "@/components/subjects/subjectPage/SubjectOverview"
import TopicsSection from "@/components/subjects/topics/TopicsSection"
import StudyPlanSection from "@/components/subjects/subjectPage/StudyPlanSection"
import MaterialsSection from "@/components/subjects/materials/MaterialsSection"
import FloatingSidebar from "@/components/subjects/FloatingSidebar"
import { Loader2, ArrowLeft, BookOpen, Target, BarChart3, Sparkles, Users, Zap } from "lucide-react"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary/20 rounded-full animate-pulse flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-secondary" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-3">Načítavam predmet</h2>
            <p className="text-lg text-muted-foreground">Pripravujeme váš študijný priestor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (data.error || !data.subject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 flex items-center justify-center">
        <div className="text-center space-y-8 max-w-md">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-destructive mb-4">Predmet sa nenašiel</h2>
            <p className="text-lg text-muted-foreground mb-8">{data.error || "Nepodarilo sa načítať predmet"}</p>
            <Link href="/dashboard">
              <Button size="lg" className="gap-3">
                <ArrowLeft className="h-5 w-5" />
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedTopics = subject.topics?.filter((t: any) => t.status === TopicStatus.COMPLETED).length || 0
  const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
  const isCompleted = progressPercentage === 100

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Sidebar */}
      <FloatingSidebar />

      {/* Top Navigation */}
      <header className="top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="w-full px-8 py-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Left side */}
            <div className="flex items-center gap-6">
              <Link href="/dashboard">
                <Button variant="ghost" size="lg" className="gap-3 hover:bg-primary/10">
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-medium">Dashboard</span>
                </Button>
              </Link>

              <div className="h-8 w-px bg-border" />

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {subject.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
                  <p className="text-muted-foreground">Študijný predmet</p>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-2 px-4 py-2 text-sm">
                <Target className="h-4 w-4" />
                {completedTopics}/{totalTopics} tém
              </Badge>
              <Badge variant="outline" className="gap-2 px-4 py-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                {progressPercentage}% pokrok
              </Badge>
              {isCompleted && (
                <Badge className="gap-2 px-4 py-2 bg-green-500 hover:bg-green-600">
                  <Sparkles className="h-4 w-4" />
                  Dokončené!
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {/* Overview Section */}
        <section id="overview" className="min-h-screen flex items-center justify-center py-20">
          <div className="w-full max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-full mb-8">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span className="text-blue-600 font-semibold">Prehľad Predmetu</span>
              </div>
              <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
                Váš študijný <span className="text-primary">pokrok</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Komplexný pohľad na všetky aspekty vášho štúdia, štatistiky a dosiahnuté míľniky
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <SubjectOverview subject={subject} />
            </div>
          </div>
        </section>

        {/* Topics Section */}
        <section id="topics" className="min-h-screen flex items-center justify-center py-20 bg-muted/20">
          <div className="w-full max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-green-50 dark:bg-green-900/20 px-6 py-3 rounded-full mb-8">
                <Target className="h-6 w-6 text-green-600" />
                <span className="text-green-600 font-semibold">Témy a Obsah</span>
              </div>
              <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
                Organizujte svoje <span className="text-green-600">témy</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Spravujte obsah predmetu, sledujte pokrok jednotlivých tém a udržujte si prehľad
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-left-6 duration-1000">
              <div className="bg-background rounded-3xl border border-border shadow-2xl overflow-hidden">
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

        {/* Study Plan Section */}
        <section id="plan" className="min-h-screen flex items-center justify-center py-20">
          <div className="w-full max-w-7xl mx-auto px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 px-6 py-3 rounded-full mb-8">
                <Users className="h-6 w-6 text-purple-600" />
                <span className="text-purple-600 font-semibold">AI Študijný Plán</span>
              </div>
              <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
                Inteligentný <span className="text-purple-600">plán štúdia</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Nechajte AI vytvoriť personalizovaný študijný plán prispôsobený vašim potrebám a tempu
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <div className="bg-background rounded-3xl border border-border shadow-2xl overflow-hidden">
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

        {/* Materials Section */}
        <section id="materials" className="min-h-screen flex items-center justify-center py-20 bg-muted/20">
          <div className="w-full max-w-6xl mx-auto px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 px-6 py-3 rounded-full mb-8">
                <Zap className="h-6 w-6 text-amber-600" />
                <span className="text-amber-600 font-semibold">Študijné Materiály</span>
              </div>
              <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
                Vaše <span className="text-amber-600">materiály</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Centralizované úložisko pre všetky vaše študijné materiály s pokročilým vyhľadávaním
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-right-6 duration-1000">
              <div className="bg-background rounded-3xl border border-border shadow-2xl overflow-hidden">
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
      </main>

      {/* Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-muted/30 z-30">
        <div
          className="h-full bg-gradient-to-r from-primary via-secondary to-primary transition-all duration-700 ease-out"
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
