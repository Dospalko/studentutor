"use client"

import type React from "react"

import ProtectedRoute from "@/components/ProtectedRoute"
import { useContext, useEffect, useState, type FormEvent } from "react"
import { AuthContext } from "@/context/AuthContext"
import { getSubjects, createSubject, type Subject, type SubjectCreate, deleteSubject } from "@/services/subjectService"
import Link from "next/link"

// Shadcn/ui imports
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  ExternalLink,
  BookCopy,
  AlertCircle,
  Loader2,
  PlusCircle,
  BookOpenCheck,
  TrendingUp,
  Target,
  Sparkles,
  GraduationCap,
  Clock,
  BarChart3,
  Calendar,
  Award,
  Zap,
  ArrowRight,
  BookOpen,
  Users,
  Star,
} from "lucide-react"
import { TopicStatus } from "@/types/study"
import { useAchievementNotifier } from "@/hooks/useAchievementNotifier"

const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * value))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{count}</span>
}

const StatCard = ({
  icon,
  label,
  value,
  subtitle,
  gradient,
  delay = 0,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  subtitle?: string
  gradient: string
  delay?: number
}) => (
  <div
    className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${gradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">{icon}</div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
          </div>
          <div className="text-sm text-white/80 font-medium">{label}</div>
        </div>
      </div>
      {subtitle && <div className="text-xs text-white/70">{subtitle}</div>}
    </div>
  </div>
)

function DashboardContent() {
  const authContext = useContext(AuthContext)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState("")
  const [newSubjectDescription, setNewSubjectDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const checkForNewAchievements = useAchievementNotifier()

  useEffect(() => {
    if (authContext?.token) {
      setIsLoadingSubjects(true)
      setError(null)
      getSubjects(authContext.token)
        .then((data) => {
          setSubjects(data.sort((a, b) => a.name.localeCompare(b.name)))
        })
        .catch((err) => {
          console.error("Error fetching subjects:", err)
          setError((err as Error).message || "Nepodarilo sa načítať predmety.")
        })
        .finally(() => {
          setIsLoadingSubjects(false)
        })
    }
  }, [authContext?.token])

  const handleCreateSubject = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!authContext?.token || !newSubjectName.trim()) {
      setError("Názov predmetu je povinný.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const subjectData: SubjectCreate = {
      name: newSubjectName.trim(),
      description: newSubjectDescription.trim() || undefined,
    }

    try {
      const created = await createSubject(subjectData, authContext.token)
      setSubjects((prevSubjects) => [created, ...prevSubjects].sort((a, b) => a.name.localeCompare(b.name)))
      setNewSubjectName("")
      setNewSubjectDescription("")
      setIsAddSubjectDialogOpen(false)
      await checkForNewAchievements()
    } catch (err: unknown) {
      console.error("Error creating subject:", err)
      setError(err instanceof Error ? err.message : "Nepodarilo sa vytvoriť predmet.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubject = async (subjectId: number) => {
    if (
      !authContext?.token ||
      !confirm("Naozaj chcete zmazať tento predmet a všetky jeho témy a plány? Táto akcia je nenávratná.")
    ) {
      return
    }

    setError(null)
    try {
      await deleteSubject(subjectId, authContext.token)
      setSubjects((prevSubjects) => prevSubjects.filter((s) => s.id !== subjectId))
    } catch (err: unknown) {
      console.error("Error deleting subject:", err)
      setError(err instanceof Error ? err.message : "Nepodarilo sa zmazať predmet.")
    }
  }

  const calculateSubjectProgress = (subject: Subject): number => {
    if (!subject.topics || subject.topics.length === 0) return 0
    const completedTopics = subject.topics.filter((t) => t.status === TopicStatus.COMPLETED).length
    return Math.round((completedTopics / subject.topics.length) * 100)
  }

  const getOverallStats = () => {
    const totalSubjects = subjects.length
    const totalTopics = subjects.reduce((acc, subject) => acc + (subject.topics?.length || 0), 0)
    const completedTopics = subjects.reduce(
      (acc, subject) => acc + (subject.topics?.filter((t) => t.status === TopicStatus.COMPLETED).length || 0),
      0,
    )
    const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
    const activeSubjects = subjects.filter((s) => (s.topics?.length || 0) > 0).length

    return { totalSubjects, totalTopics, completedTopics, overallProgress, activeSubjects }
  }

  if (!authContext || !authContext.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] p-4">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Načítavam dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const { user } = authContext
  const stats = getOverallStats()

  const renderHeroSection = () => (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-primary/20 mb-12">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl opacity-30" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-2xl opacity-40" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl" />

      <div className="relative p-8 md:p-12">
        <div className="flex flex-col xl:flex-row items-start justify-between gap-12">
          {/* Left side - Welcome content */}
          <div className="flex-1 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary px-4 py-2">
                <Sparkles className="mr-2 h-4 w-4" />
                Dashboard
              </Badge>
              <Badge variant="outline" className="border-secondary/30 bg-secondary/10 text-secondary px-4 py-2">
                <Calendar className="mr-2 h-4 w-4" />
                {new Date().toLocaleDateString("sk-SK", { weekday: "long" })}
              </Badge>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Vitaj späť,{" "}
              <span className="block md:inline">{user.full_name?.split(" ")[0] || user.email.split("@")[0]}! 👋</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Pripravený na ďalší krok vo svojom štúdiu? Sleduj pokrok, organizuj materiály a dosahuj svoje ciele s
              pomocou AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Dialog open={isAddSubjectDialogOpen} onOpenChange={setIsAddSubjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <PlusCircle className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
                    Pridať Nový Predmet
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                      <BookOpen className="h-6 w-6 text-primary" />
                      Pridať Nový Predmet
                    </DialogTitle>
                    <DialogDescription className="text-base">
                      Vytvor nový študijný predmet a začni organizovať svoje materiály a témy.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSubject} className="space-y-6 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="newSubjectName" className="text-sm font-medium">
                        Názov predmetu <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="newSubjectName"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        required
                        placeholder="Napr. Kvantová Fyzika, Matematická Analýza..."
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newSubjectDescription" className="text-sm font-medium">
                        Stručný popis
                      </Label>
                      <Textarea
                        id="newSubjectDescription"
                        value={newSubjectDescription}
                        onChange={(e) => setNewSubjectDescription(e.target.value)}
                        placeholder="Čo tento predmet zahŕňa? Aké témy budete študovať?"
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    {error && isAddSubjectDialogOpen && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <DialogFooter className="gap-3">
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setNewSubjectName("")
                            setNewSubjectDescription("")
                            setError(null)
                          }}
                        >
                          Zrušiť
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        disabled={isSubmitting || !newSubjectName.trim()}
                        className="bg-gradient-to-r from-primary to-secondary"
                      >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Vytvoriť predmet
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {subjects.length > 0 && (
                <Button variant="outline" size="lg" asChild className="group bg-transparent">
                  <Link href="/profile">
                    <Award className="mr-2 h-5 w-5" />
                    Môj Profil
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Right side - Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 w-full xl:w-80">
            <StatCard
              icon={<TrendingUp className="h-6 w-6 text-white" />}
              label="Celkový pokrok"
              value={`${stats.overallProgress}%`}
              subtitle={`${stats.completedTopics} z ${stats.totalTopics} tém`}
              gradient="from-blue-500 to-blue-600"
              delay={0}
            />
            <StatCard
              icon={<GraduationCap className="h-6 w-6 text-white" />}
              label="Aktívne predmety"
              value={stats.activeSubjects}
              subtitle={`${stats.totalSubjects} celkom`}
              gradient="from-green-500 to-green-600"
              delay={100}
            />
            <StatCard
              icon={<BookCopy className="h-6 w-6 text-white" />}
              label="Témy celkom"
              value={stats.totalTopics}
              subtitle="Všetky vaše témy"
              gradient="from-purple-500 to-purple-600"
              delay={200}
            />
            <StatCard
              icon={<Target className="h-6 w-6 text-white" />}
              label="Dokončené"
              value={stats.completedTopics}
              subtitle="Hotové témy"
              gradient="from-amber-500 to-amber-600"
              delay={300}
            />
          </div>
        </div>

        {/* Progress bar */}
        {stats.totalTopics > 0 && (
          <div className="mt-8 p-6 rounded-2xl bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-white/20">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-muted-foreground">Celkový pokrok štúdia</span>
              <span className="text-sm font-bold">{stats.overallProgress}%</span>
            </div>
            <Progress value={stats.overallProgress} className="h-3" />
          </div>
        )}
      </div>
    </div>
  )

  const renderSubjectGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {subjects.map((subject, index) => {
        const progress = calculateSubjectProgress(subject)
        const uncompletedTopicsCount = subject.topics
          ? subject.topics.filter((t) => t.status !== TopicStatus.COMPLETED).length
          : 0
        const isCompleted = progress === 100

        return (
          <Card
            key={subject.id}
            className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 ease-out hover:scale-[1.02] border-muted/40 hover:border-primary/40 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <CardHeader className="pb-4 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-xl font-bold text-primary hover:text-primary/80 transition-colors line-clamp-2 mb-2">
                    <Link href={`/subjects/${subject.id}`} className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 flex-shrink-0" />
                      {subject.name}
                    </Link>
                  </CardTitle>
                  {subject.description && (
                    <CardDescription className="text-sm line-clamp-3 leading-relaxed">
                      {subject.description}
                    </CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSubject(subject.id)}
                  className="text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Zmazať predmet</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-grow space-y-6 relative z-10">
              {/* Progress section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Pokrok</span>
                  <Badge
                    variant={isCompleted ? "default" : progress > 50 ? "secondary" : "outline"}
                    className={
                      isCompleted
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : progress > 50
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : ""
                    }
                  >
                    {progress}%
                  </Badge>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <BookCopy className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      {subject.topics?.length || 0}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">tém</div>
                  </div>
                </div>

                {uncompletedTopicsCount > 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <div>
                      <div className="text-sm font-bold text-amber-700 dark:text-amber-300">
                        {uncompletedTopicsCount}
                      </div>
                      <div className="text-xs text-amber-600 dark:text-amber-400">zostáva</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <Star className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="text-sm font-bold text-green-700 dark:text-green-300">100%</div>
                      <div className="text-xs text-green-600 dark:text-green-400">hotovo</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Completion badge */}
              {isCompleted && (
                <Badge className="w-full justify-center bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2">
                  <Target className="mr-2 h-4 w-4" />
                  Predmet dokončený! 🎉
                </Badge>
              )}
            </CardContent>

            <CardFooter className="pt-4 relative z-10">
              <Link href={`/subjects/${subject.id}`} className="w-full">
                <Button
                  variant="outline"
                  className="w-full group bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 border-primary/20 hover:border-primary/40 transition-all duration-300"
                >
                  <ExternalLink className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  Otvoriť Predmet
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )

  const renderLoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-3/4 bg-muted rounded-lg"></div>
            <div className="h-4 w-full bg-muted rounded mt-2"></div>
            <div className="h-4 w-5/6 bg-muted rounded mt-1"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-2 w-full bg-muted rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-muted rounded-lg"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-10 w-full bg-muted rounded-lg"></div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  const renderEmptyState = () => (
    <div className="text-center py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-3xl"></div>
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-4">
            <BookOpenCheck className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute -top-2 -right-8 w-12 h-12 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-secondary" />
          </div>
          <div className="absolute -bottom-2 -left-8 w-8 h-8 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Začni svoju študijnú cestu! 🚀
        </h2>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg mx-auto">
          Zatiaľ nemáš pridané žiadne predmety. Vytvor svoj prvý predmet a začni organizovať svoje štúdium s pomocou AI
          asistenta.
        </p>

        <div className="space-y-4">
          <Dialog open={isAddSubjectDialogOpen} onOpenChange={setIsAddSubjectDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="group bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <PlusCircle className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
                Pridať Prvý Predmet
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                  Pridať Nový Predmet
                </DialogTitle>
                <DialogDescription className="text-base">
                  Vytvor svoj prvý študijný predmet a začni organizovať materiály a témy.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubject} className="space-y-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="newSubjectNameDialog" className="text-sm font-medium">
                    Názov predmetu <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="newSubjectNameDialog"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    required
                    placeholder="Napr. Kvantová Fyzika, Matematická Analýza..."
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newSubjectDescriptionDialog" className="text-sm font-medium">
                    Stručný popis
                  </Label>
                  <Textarea
                    id="newSubjectDescriptionDialog"
                    value={newSubjectDescription}
                    onChange={(e) => setNewSubjectDescription(e.target.value)}
                    placeholder="Čo tento predmet zahŕňa? Aké témy budete študovať?"
                    rows={4}
                    className="resize-none"
                  />
                </div>
                {error && isAddSubjectDialogOpen && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <DialogFooter className="gap-3">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setNewSubjectName("")
                        setNewSubjectDescription("")
                        setError(null)
                      }}
                    >
                      Zrušiť
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newSubjectName.trim()}
                    className="bg-gradient-to-r from-primary to-secondary"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Vytvoriť predmet
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>AI asistent</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Sledovanie pokroku</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Achievementy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl">
        {renderHeroSection()}

        {error && !isAddSubjectDialogOpen && (
          <Alert variant="destructive" className="mb-8 border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nastala Chyba</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Tvoje Predmety
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                {subjects.length > 0
                  ? `Spravuj ${subjects.length} predmet${subjects.length !== 1 ? "y" : ""} a sleduj pokrok`
                  : "Začni pridaním svojho prvého predmetu"}
              </p>
            </div>
            {subjects.length > 0 && (
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-sm px-4 py-2 border-primary/30 bg-primary/10">
                  <Target className="mr-2 h-4 w-4" />
                  {stats.completedTopics} z {stats.totalTopics} tém
                </Badge>
                <Badge variant="outline" className="text-sm px-4 py-2 border-secondary/30 bg-secondary/10">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  {stats.overallProgress}% pokrok
                </Badge>
              </div>
            )}
          </div>

          {isLoadingSubjects ? renderLoadingState() : subjects.length > 0 ? renderSubjectGrid() : renderEmptyState()}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
