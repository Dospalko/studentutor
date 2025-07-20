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
import { Loader2, ArrowLeft, BookOpen, Target, BarChart3, Sparkles, Users, Zap, Star, Circle } from "lucide-react"
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Loading Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20">
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                }}
              >
                <div className="w-2 h-2 bg-primary/20 rounded-full animate-bounce" />
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto border border-white/20 shadow-2xl">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-secondary to-primary rounded-full animate-pulse flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-4xl font-bold text-foreground mb-4">Načítavam predmet</h2>
              <p className="text-xl text-muted-foreground">Pripravujeme váš študijný priestor...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (data.error || !data.subject) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Error Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-pink-900/20">
          <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              >
                <Circle className="w-4 h-4 text-red-200/30 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-10 max-w-lg">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto border border-red-200/30 shadow-2xl">
              <BookOpen className="h-12 w-12 text-destructive" />
            </div>
            <div className="backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-2xl p-8 border border-white/20">
              <h2 className="text-4xl font-bold text-destructive mb-6">Predmet sa nenašiel</h2>
              <p className="text-xl text-muted-foreground mb-8">{data.error || "Nepodarilo sa načítať predmet"}</p>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="gap-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Späť na Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { subject } = data
  const totalTopics = subject.topics?.length || 0
  const completedTopics = subject.topics?.filter((t: any) => t.status === TopicStatus.COMPLETED).length || 0
  const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
  const isCompleted = progressPercentage === 100

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Creative Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900/30" />

        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            >
              {i % 3 === 0 && <div className="w-4 h-4 bg-primary/30 rounded-full" />}
              {i % 3 === 1 && <div className="w-3 h-3 bg-secondary/30 rotate-45" />}
              {i % 3 === 2 && <Star className="w-5 h-5 text-amber-400/30" />}
            </div>
          ))}
        </div>

        {/* Large decorative circles */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/10 to-primary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-amber-400/5 to-orange-400/5 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "4s" }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Floating Sidebar */}
      <FloatingSidebar />

      {/* Top Navigation with glassmorphism */}
      <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 shadow-lg">
        <div className="w-full px-8 py-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Left side */}
            <div className="flex items-center gap-6">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="lg"
                  className="gap-3 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-medium">Dashboard</span>
                </Button>
              </Link>

              <div className="h-8 w-px bg-white/30" />

              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary via-secondary to-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-2xl">
                    {subject.name.charAt(0)}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    {subject.name}
                  </h1>
                  <p className="text-muted-foreground">Študijný predmet</p>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className="gap-2 px-4 py-2 text-sm backdrop-blur-sm bg-white/20 dark:bg-black/20 border-white/30"
              >
                <Target className="h-4 w-4" />
                {completedTopics}/{totalTopics} tém
              </Badge>
              <Badge
                variant="outline"
                className="gap-2 px-4 py-2 text-sm backdrop-blur-sm bg-white/20 dark:bg-black/20 border-white/30"
              >
                <BarChart3 className="h-4 w-4" />
                {progressPercentage}% pokrok
              </Badge>
              {isCompleted && (
                <Badge className="gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg animate-pulse">
                  <Sparkles className="h-4 w-4" />
                  Dokončené!
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full relative z-10">
        {/* Overview Section */}
        <section id="overview" className="min-h-screen flex items-center justify-center py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:via-blue-900/10" />
          <div className="w-full max-w-7xl mx-auto px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-white/20 dark:bg-black/20 backdrop-blur-xl px-8 py-4 rounded-full mb-8 border border-white/30 shadow-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span className="text-blue-600 font-semibold text-lg">Prehľad Predmetu</span>
              </div>
              <h2 className="text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                  Váš študijný pokrok
                </span>
              </h2>
              <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Komplexný pohľad na všetky aspekty vášho štúdia, štatistiky a dosiahnuté míľniky
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-3xl border border-white/20 shadow-2xl p-2">
                <SubjectOverview subject={subject} />
              </div>
            </div>
          </div>
        </section>

        {/* Topics Section */}
        <section id="topics" className="min-h-screen flex items-center justify-center py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/30 to-transparent dark:via-green-900/10" />
          <div className="w-full max-w-7xl mx-auto px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-white/20 dark:bg-black/20 backdrop-blur-xl px-8 py-4 rounded-full mb-8 border border-white/30 shadow-lg">
                <Target className="h-6 w-6 text-green-600" />
                <span className="text-green-600 font-semibold text-lg">Témy a Obsah</span>
              </div>
              <h2 className="text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-foreground via-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Organizujte svoje témy
                </span>
              </h2>
              <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Spravujte obsah predmetu, sledujte pokrok jednotlivých tém a udržujte si prehľad
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
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
        <section id="plan" className="min-h-screen flex items-center justify-center py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-50/30 to-transparent dark:via-purple-900/10" />
          <div className="w-full max-w-7xl mx-auto px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-white/20 dark:bg-black/20 backdrop-blur-xl px-8 py-4 rounded-full mb-8 border border-white/30 shadow-lg">
                <Users className="h-6 w-6 text-purple-600" />
                <span className="text-purple-600 font-semibold text-lg">AI Študijný Plán</span>
              </div>
              <h2 className="text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-foreground via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Inteligentný plán štúdia
                </span>
              </h2>
              <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Nechajte AI vytvoriť personalizovaný študijný plán prispôsobený vašim potrebám a tempu
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
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
        <section id="materials" className="min-h-screen flex items-center justify-center py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/30 to-transparent dark:via-amber-900/10" />
          <div className="w-full max-w-7xl mx-auto px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 bg-white/20 dark:bg-black/20 backdrop-blur-xl px-8 py-4 rounded-full mb-8 border border-white/30 shadow-lg">
                <Zap className="h-6 w-6 text-amber-600" />
                <span className="text-amber-600 font-semibold text-lg">Študijné Materiály</span>
              </div>
              <h2 className="text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-foreground via-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Vaše materiály
                </span>
              </h2>
              <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Centralizované úložisko pre všetky vaše študijné materiály s pokročilým vyhľadávaním
              </p>
            </div>
            <div className="animate-in fade-in slide-in-from-right-8 duration-1000">
              <div className="backdrop-blur-sm bg-white/10 dark:bg-black/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
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

      {/* Enhanced Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-2 bg-black/10 dark:bg-white/10 backdrop-blur-sm z-30">
        <div
          className="h-full bg-gradient-to-r from-primary via-secondary to-primary shadow-lg transition-all duration-1000 ease-out relative overflow-hidden"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(120deg); }
          66% { transform: translateY(5px) rotate(240deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
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
