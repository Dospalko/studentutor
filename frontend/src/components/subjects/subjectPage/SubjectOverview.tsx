"use client"

import type { FC } from "react"
import { useState, useEffect, useContext } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  Timer,
  Loader2,
} from "lucide-react"
import { getSubjects, type Subject } from "@/services/subjectService"
import { fetchUserStats } from "@/services/studyMaterialService"
import { AuthContext } from "@/context/AuthContext"
import { TopicStatus } from "@/types/study"

interface SubjectOverviewProps {
  subject: Subject & { topics?: { id: number; status: string }[] }
}

interface UserStatsApi {
  materials: {
    total: number
    summaries: number
    tagged: number
    words_extracted: number
  }
  subjects: {
    total: number
    topics: number
    topics_completed: number
  }
  study_blocks: {
    total: number
    completed: number
    skipped: number
    minutes_scheduled: number
  }
  achievements_unlocked: number
}

const SubjectOverview: FC<SubjectOverviewProps> = ({ subject }) => {
  const { token } = useContext(AuthContext)!
  const [, setUserStats] = useState<UserStatsApi | null>(null)
  const [, setAllSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  // Load additional data for richer overview
  useEffect(() => {
    if (!token) return

    const loadData = async () => {
      try {
        const [statsData, subjectsData] = await Promise.all([fetchUserStats(token), getSubjects(token)])
        setUserStats(statsData)
        setAllSubjects(subjectsData)
      } catch (error) {
        console.error("Error loading overview data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [token])

  // Compute current subject stats
  const totalTopics = subject.topics?.length ?? 0
  const completedTopics = subject.topics?.filter((t) => t.status === TopicStatus.COMPLETED).length ?? 0
  const inProgressTopics = subject.topics?.filter((t) => t.status === TopicStatus.IN_PROGRESS).length ?? 0
  const notStartedTopics = subject.topics?.filter((t) => t.status === TopicStatus.NOT_STARTED).length ?? 0
  const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
  const isCompleted = progress === 100

 

  const stats = [
    {
      label: "Témy celkom",
      value: totalTopics,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200",
    },
    {
      label: "Dokončené",
      value: completedTopics,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200",
    },
    {
      label: "V procese",
      value: inProgressTopics,
      icon: Timer,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-200",
    },
    {
      label: "Nezačaté",
      value: notStartedTopics,
      icon: Clock,
      color: "text-slate-600",
      bgColor: "bg-slate-50 dark:bg-slate-900/20",
      borderColor: "border-slate-200",
    },
  ]

 

  if (loading) {
    return (
      <div className="space-y-8">
        <Card className="overflow-hidden border-2 border-primary/20">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-4" />
            <p className="text-muted-foreground">Načítavam prehľad predmetu...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Main Subject Card */}
      <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl opacity-60" />

        <CardHeader className="relative z-10 pb-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-primary/10 shadow-lg">
                  <BookOpenCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-4xl font-bold text-primary mb-2">{subject.name}</CardTitle>
                  {isCompleted && (
                    <Badge className="bg-green-500 hover:bg-green-600 text-white shadow-lg">
                      <Award className="h-4 w-4 mr-2" />
                      Predmet dokončený! 🎉
                    </Badge>
                  )}
                </div>
              </div>
              {subject.description ? (
                <CardDescription className="text-lg leading-relaxed max-w-3xl text-muted-foreground">
                  {subject.description}
                </CardDescription>
              ) : (
                <CardDescription className="text-lg leading-relaxed max-w-3xl text-muted-foreground italic">
                  Pridajte popis predmetu pre lepšiu organizáciu vášho štúdia
                </CardDescription>
              )}
            </div>

            {/* Progress Circle */}
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted stroke-current"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary stroke-current"
                    strokeWidth="3"
                    strokeDasharray={`${progress}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-primary">{progress}%</span>
                    <div className="text-xs text-muted-foreground">pokrok</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Celkový pokrok predmetu</span>
              <span className="text-sm font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3 shadow-inner" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedTopics} dokončených</span>
              <span>{totalTopics - completedTopics} zostáva</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.label}
              className={`border-2 ${stat.borderColor} ${stat.bgColor} hover:shadow-lg transition-all duration-300 hover:scale-105`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                  <div className="text-right">
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </div>
                </div>
                <p className="text-sm font-medium opacity-80">{stat.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

    

    </div>
  )
}

export default SubjectOverview
