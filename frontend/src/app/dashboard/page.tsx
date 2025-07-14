"use client"

import ProtectedRoute from "@/components/ProtectedRoute"
import { useContext, useEffect, useState } from "react"
import { AuthContext } from "@/context/AuthContext"
import { getSubjects, createSubject, type Subject, type SubjectCreate, deleteSubject } from "@/services/subjectService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Loader2, Target, TrendingUp } from "lucide-react"
import { TopicStatus } from "@/types/study"
import { useAchievementNotifier } from "@/hooks/useAchievementNotifier"

// Dashboard components
import { DashboardHero } from "@/components/dashboard/DashboardHero"
import { SubjectGrid } from "@/components/dashboard/SubjectGrid"
import { LoadingState } from "@/components/dashboard/LoadingState"
import { EmptyState } from "@/components/dashboard/EmptyState"

interface DashboardStats {
  totalSubjects: number
  totalTopics: number
  completedTopics: number
  overallProgress: number
  activeSubjects: number
}

function DashboardContent() {
  const authContext = useContext(AuthContext)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false)
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

  const handleCreateSubject = async (name: string, description: string) => {
    if (!authContext?.token || !name.trim()) {
      setError("Názov predmetu je povinný.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    const subjectData: SubjectCreate = {
      name: name.trim(),
      description: description || undefined,
    }

    try {
      const created = await createSubject(subjectData, authContext.token)
      setSubjects((prevSubjects) => [created, ...prevSubjects].sort((a, b) => a.name.localeCompare(b.name)))
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

  const getOverallStats = (): DashboardStats => {
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
  const userName = user.full_name?.split(" ")[0] || user.email.split("@")[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl">
        <DashboardHero
          userName={userName}
          stats={stats}
          onCreateSubject={handleCreateSubject}
          isSubmitting={isSubmitting}
          error={error}
          isCreateDialogOpen={isAddSubjectDialogOpen}
          onCreateDialogChange={setIsAddSubjectDialogOpen}
          hasSubjects={subjects.length > 0}
        />

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

          {isLoadingSubjects ? (
            <LoadingState />
          ) : subjects.length > 0 ? (
            <SubjectGrid subjects={subjects} onDeleteSubject={handleDeleteSubject} />
          ) : (
            <EmptyState
              onCreateSubject={handleCreateSubject}
              isSubmitting={isSubmitting}
              error={error}
              isCreateDialogOpen={isAddSubjectDialogOpen}
              onCreateDialogChange={setIsAddSubjectDialogOpen}
            />
          )}
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
