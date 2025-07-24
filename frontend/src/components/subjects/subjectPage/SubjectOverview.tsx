"use client"

import { FC } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpenCheck, CheckCircle2, TrendingUp, Clock, Target, Calendar, Award, Zap, BarChart3, Users, FileText, ArrowRight, Sparkles, BookOpen, Timer } from 'lucide-react'
import type { Subject } from "@/services/subjectService"

interface SubjectOverviewProps {
  subject: Subject & { topics?: { id: number; status: string }[] }
}

const SubjectOverview: FC<SubjectOverviewProps> = ({ subject }) => {
  // Compute stats
  const totalTopics = subject.topics?.length ?? 0
  const completedTopics = subject.topics?.filter((t) => t.status === "COMPLETED").length ?? 0
  const inProgressTopics = subject.topics?.filter((t) => t.status === "IN_PROGRESS").length ?? 0
  const notStartedTopics = subject.topics?.filter((t) => t.status === "NOT_STARTED").length ?? 0
  const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
  const isCompleted = progress === 100

  // Mock additional data for richer overview
  const studyTime = "12h 30m" // This would come from actual data
  const lastActivity = "pred 2 hodinami"
  const streak = 5 // Study streak days
  const nextDeadline = "15. december"

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
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "hover:bg-blue-50",
      action: () => console.log("Add topic"),
    },
    {
      label: "Generovať plán",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "hover:bg-purple-50",
      action: () => console.log("Generate plan"),
    },
    {
      label: "Nahrať materiál",
      icon: FileText,
      color: "text-amber-600",
      bgColor: "hover:bg-amber-50",
      action: () => console.log("Upload material"),
    },
    {
      label: "Zobraziť analytiku",
      icon: BarChart3,
      color: "text-indigo-600",
      bgColor: "hover:bg-indigo-50",
      action: () => console.log("Show analytics"),
    },
  ]

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
                  <p className="text-sm text-muted-foreground">Tento mesiac</p>
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
                  <p className="font-medium">Študijná séria</p>
                  <p className="text-sm text-muted-foreground">Dni v rade</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{streak}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Posledná aktivita</p>
                  <p className="text-sm text-muted-foreground">{lastActivity}</p>
                </div>
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

      {/* AI Recommendations */}
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
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Začnite pridaním prvej témy
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                      Vytvorte štruktúru vášho predmetu pridaním tém, ktoré chcete študovať. AI vám potom pomôže vytvoriť optimálny študijný plán.
                    </p>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
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
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                      Zamerajte sa na aktívne témy
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                      Máte {inProgressTopics} tém v procese. Odporúčame dokončiť tieto témy pred začatím nových.
                    </p>
                    <Button size="sm" variant="outline" className="text-amber-600 border-amber-300 bg-transparent">
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
                    <p className="font-medium text-green-800 dark:text-green-200 mb-2">
                      Výborný pokrok! 🎉
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                      Dokončili ste už {progress}% predmetu. Pokračujte v tomto tempe a predmet dokončíte čoskoro!
                    </p>
                    <Button size="sm" variant="outline" className="text-green-600 border-green-300 bg-transparent">
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
    </div>
  )
}

export default SubjectOverview
