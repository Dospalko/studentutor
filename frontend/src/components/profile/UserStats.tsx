"use client"

import type React from "react"
import { useEffect, useState, useContext } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Loader2,
  FileText,
  Sparkles,
  Tags,
  AlignJustify,
  GraduationCap,
  BookOpenCheck,
  Layers,
  CheckCircle2,
  SkipForward,
  Clock8,
  Award,
  TrendingUp,
  Target,
  BarChart3,
} from "lucide-react"
import { fetchUserStats } from "@/services/studyMaterialService"
import { AuthContext } from "@/context/AuthContext"
import StatsCharts from "./StatsCharts"

/* Helper Components */
const AnimatedCounter = ({ value, duration = 800 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start: number
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setCount(Math.floor(progress * value))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value, duration])

  return <span>{count.toLocaleString()}</span>
}

const StatCard = ({
  icon,
  label,
  value,
  subtitle,
  progress,
  delay = 0,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  subtitle?: string
  progress?: number
  delay?: number
}) => (
  <div
    className="group p-4 rounded-lg border border-muted/40 bg-background hover:border-primary/40 hover:shadow-md transition-all duration-300"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      {progress !== undefined && (
        <div className="text-xs text-muted-foreground font-medium">{Math.round(progress)}%</div>
      )}
    </div>
    <div className="space-y-1">
      <div className="text-2xl font-bold text-foreground">
        {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
      </div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
      {subtitle && <div className="text-xs text-muted-foreground/70">{subtitle}</div>}
      {progress !== undefined && <Progress value={progress} className="h-1 mt-2" />}
    </div>
  </div>
)

const CategorySection = ({
  title,
  icon,
  children,
  badge,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  badge?: string
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      {badge && (
        <Badge variant="outline" className="text-xs">
          {badge}
        </Badge>
      )}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
  </div>
)

/* Main Component */
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

export default function UserStats() {
  const { token } = useContext(AuthContext)!
  const [stats, setStats] = useState<UserStatsApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetchUserStats(token)
      .then(setStats)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Načítavam štatistiky...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="py-8 text-center">
          <p className="text-destructive font-medium">{error ?? "Neznáma chyba"}</p>
        </CardContent>
      </Card>
    )
  }

  const { materials, subjects, study_blocks: blocks, achievements_unlocked } = stats

  const prettyMinutes = (m: number) => {
    const h = Math.floor(m / 60)
    return h ? `${h}h ${m % 60}m` : `${m}m`
  }

  const materialTaggedRate = materials.total ? (materials.tagged / materials.total) * 100 : 0
  const subjectCompletionRate = subjects.topics ? (subjects.topics_completed / subjects.topics) * 100 : 0
  const blockCompletionRate = blocks.total ? (blocks.completed / blocks.total) * 100 : 0
  const totalItems = materials.total + subjects.total + blocks.total

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Moje Štatistiky</CardTitle>
                <p className="text-muted-foreground">Prehľad vášho pokroku v štúdiu</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <BarChart3 className="h-4 w-4" />
                    Grafy
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Vizualizácia Štatistík
                    </DialogTitle>
                  </DialogHeader>
                  <StatsCharts data={stats} />
                </DialogContent>
              </Dialog>
              <Badge variant="outline">
                <Target className="h-3 w-3 mr-1" />
                {totalItems} položiek
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Materials Section */}
      <CategorySection
        title="Študijné Materiály"
        icon={<FileText className="h-5 w-5 text-blue-600" />}
        badge={`${materials.total} celkom`}
      >
        <StatCard icon={<FileText className="h-5 w-5" />} label="Materiály" value={materials.total} />
        <StatCard
          icon={<AlignJustify className="h-5 w-5" />}
          label="Súhrny"
          value={materials.summaries}
          subtitle="AI generované"
          delay={100}
        />
        <StatCard
          icon={<Tags className="h-5 w-5" />}
          label="Tagované"
          value={materials.tagged}
          progress={materialTaggedRate}
          delay={200}
        />
        <StatCard
          icon={<BookOpenCheck className="h-5 w-5" />}
          label="Slová"
          value={materials.words_extracted}
          subtitle="extrahované"
          delay={300}
        />
      </CategorySection>

      {/* Subjects Section */}
      <CategorySection
        title="Predmety & Témy"
        icon={<GraduationCap className="h-5 w-5 text-emerald-600" />}
        badge={`${subjects.topics_completed}/${subjects.topics} hotovo`}
      >
        <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Predmety" value={subjects.total} />
        <StatCard icon={<Layers className="h-5 w-5" />} label="Témy" value={subjects.topics} delay={100} />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Dokončené"
          value={subjects.topics_completed}
          progress={subjectCompletionRate}
          delay={200}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Úspešnosť"
          value={`${Math.round(subjectCompletionRate)}%`}
          subtitle="dokončené témy"
          delay={300}
        />
      </CategorySection>

      {/* Study Blocks Section */}
      <CategorySection
        title="Študijné Bloky"
        icon={<Clock8 className="h-5 w-5 text-amber-600" />}
        badge={`${prettyMinutes(blocks.minutes_scheduled)} naplánované`}
      >
        <StatCard icon={<Clock8 className="h-5 w-5" />} label="Bloky" value={blocks.total} />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Dokončené"
          value={blocks.completed}
          progress={blockCompletionRate}
          delay={100}
        />
        <StatCard icon={<SkipForward className="h-5 w-5" />} label="Preskočené" value={blocks.skipped} delay={200} />
        <StatCard
          icon={<Clock8 className="h-5 w-5" />}
          label="Čas štúdia"
          value={prettyMinutes(blocks.minutes_scheduled)}
          delay={300}
        />
      </CategorySection>

      {/* Achievements Section */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-green-100 dark:bg-green-900/30">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300">Achievementy</h3>
                <p className="text-green-600 dark:text-green-400">Vaše úspechy a míľniky</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                <AnimatedCounter value={achievements_unlocked} />
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">odomknuté</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
