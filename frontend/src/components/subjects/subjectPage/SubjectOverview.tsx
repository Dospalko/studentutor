"use client"

import type { FC } from "react"
import { useState, useEffect, useContext } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BookOpenCheck,
  CheckCircle2,
  TrendingUp,
  Clock,
  Target,
  Calendar,
  Award,
  Zap,
  BarChart3,
  Users,
  FileText,
  ArrowRight,
  Sparkles,
  BookOpen,
  Timer,
  Loader2,
  Plus,
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
  const [userStats, setUserStats] = useState<UserStatsApi | null>(null)
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
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

  // Calculate study time from user stats
  const prettyMinutes = (m: number) => {
    const h = Math.floor(m / 60)
    return h ? `${h}h ${m % 60}m` : `${m}m`
  }

  const studyTime = userStats ? prettyMinutes(userStats.study_blocks.minutes_scheduled) : "0m"
  const totalStudyBlocks = userStats?.study_blocks.total ?? 0
  const completedBlocks = userStats?.study_blocks.completed ?? 0

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

  const quickActions = [
    {
      label: "Pridať tému",
      icon: Plus,
      color: "text-blue-600",
      bgColor: "hover:bg-blue-50",
      action: () => {
        // Scroll to topics section or trigger topic creation
        const topicsSection = document.getElementById("topics")
        if (topicsSection) {
          topicsSection.scrollIntoView({ behavior: "smooth" })
        }
      },
    },
    {
      label: "Generovať plán",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "hover:bg-purple-50",
      action: () => {
        const planSection = document.getElementById("plan")
        if (planSection) {
          planSection.scrollIntoView({ behavior: "smooth" })
        }
      },
    },
    {
      label: "Nahrať materiál",
      icon: FileText,
      color: "text-amber-600",
      bgColor: "hover:bg-amber-50",
      action: () => {
        const materialsSection = document.getElementById("materials")
        if (materialsSection) {
          materialsSection.scrollIntoView({ behavior: "smooth" })
        }
      },
    },
    {
      label: "Zobraziť analytiku",
      icon: BarChart3,
      color: "text-indigo-600",
      bgColor: "hover:bg-indigo-50",
      action: () => {
        // Could open analytics modal or navigate to analytics page
        console.log("Show analytics")
      },
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

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Activity */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Študijná aktivita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Celkový čas štúdia</p>
                  <p className="text-sm text-muted-foreground">Naplánovaný čas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{studyTime}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Dokončené bloky</p>
                  <p className="text-sm text-muted-foreground">Študijné bloky</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{completedBlocks}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Target className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Celkové achievementy</p>
                  <p className="text-sm text-muted-foreground">Odomknuté</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-amber-600">{userStats?.achievements_unlocked ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" />
              Rýchle akcie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className={`justify-start h-14 ${action.bgColor} transition-all duration-300 hover:scale-105 bg-transparent`}
                    onClick={action.action}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Icon className={`h-5 w-5 ${action.color} mr-3`} />
                    <span className="font-medium">{action.label}</span>
                    <ArrowRight className="h-4 w-4 ml-auto opacity-50" />
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations based on real data */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            AI odporúčania
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {totalTopics === 0 ? (
              <div className="p-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">Začnite pridaním prvej témy</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                      Vytvorte štruktúru vášho predmetu pridaním tém, ktoré chcete študovať. AI vám potom pomôže
                      vytvoriť optimálny študijný plán.
                    </p>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        const topicsSection = document.getElementById("topics")
                        if (topicsSection) {
                          topicsSection.scrollIntoView({ behavior: "smooth" })
                        }
                      }}
                    >
                      Pridať prvú tému
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : progress < 50 ? (
              <div className="p-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Target className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">Zamerajte sa na aktívne témy</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                      Máte {inProgressTopics} tém v procese. Odporúčame dokončiť tieto témy pred začatím nových.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-600 border-amber-300 bg-transparent"
                      onClick={() => {
                        const topicsSection = document.getElementById("topics")
                        if (topicsSection) {
                          topicsSection.scrollIntoView({ behavior: "smooth" })
                        }
                      }}
                    >
                      Zobraziť aktívne témy
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-200 mb-2">Výborný pokrok! 🎉</p>
                    <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                      Dokončili ste už {progress}% predmetu. Pokračujte v tomto tempe a predmet dokončíte čoskoro!
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-300 bg-transparent"
                      onClick={() => {
                        const planSection = document.getElementById("plan")
                        if (planSection) {
                          planSection.scrollIntoView({ behavior: "smooth" })
                        }
                      }}
                    >
                      Generovať finálny plán
                      <ArrowRight className="h-3 w-3 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Global Stats Summary */}
      {userStats && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Celkové štatistiky
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-black/20">
                <div className="text-2xl font-bold text-purple-600">{userStats.subjects.total}</div>
                <div className="text-sm text-purple-600/80">Predmetov</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-black/20">
                <div className="text-2xl font-bold text-blue-600">{userStats.materials.total}</div>
                <div className="text-sm text-blue-600/80">Materiálov</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-black/20">
                <div className="text-2xl font-bold text-green-600">{userStats.subjects.topics_completed}</div>
                <div className="text-sm text-green-600/80">Dokončených tém</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/50 dark:bg-black/20">
                <div className="text-2xl font-bold text-amber-600">{userStats.achievements_unlocked}</div>
                <div className="text-sm text-amber-600/80">Achievementov</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SubjectOverview
