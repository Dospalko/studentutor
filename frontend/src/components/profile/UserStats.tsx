"use client"

import type React from "react"

import { useEffect, useState, useContext } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
} from "lucide-react"
import { fetchUserStats } from "@/services/studyMaterialService"
import { AuthContext } from "@/context/AuthContext"

/* ───────────────────────────────────────── helpers ──────────────────────────────────────── */

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

  return <span>{count.toLocaleString()}</span>
}

const StatCard = ({
  icon,
  label,
  value,
  subtitle,
  progress,
  gradient,
  delay = 0,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  subtitle?: string
  progress?: number
  gradient: string
  delay?: number
}) => (
  <div
    className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${gradient} p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">{icon}</div>
        {progress !== undefined && <div className="text-xs text-white/70 font-medium">{Math.round(progress)}%</div>}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-white">
          {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
        </div>
        <div className="text-sm text-white/80 font-medium">{label}</div>
        {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
        {progress !== undefined && <Progress value={progress} className="h-1 bg-white/20" />}
      </div>
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
        <Badge variant="secondary" className="text-xs">
          {badge}
        </Badge>
      )}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
  </div>
)

/* ─────────────────────────────────────────────────────────────────────────────────────────── */

interface UserStats {
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
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* fetch once on mount */
  useEffect(() => {
    if (!token) return
    fetchUserStats(token)
      .then(setStats)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [token])

  /* loading & error states */
  if (loading)
    return (
      <Card className="border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Načítavam štatistiky...</p>
        </CardContent>
      </Card>
    )

  if (error || !stats)
    return (
      <Card className="border-destructive/20">
        <CardContent className="py-8 text-center">
          <div className="text-destructive text-lg font-medium mb-2">Chyba načítania štatistík</div>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )

  /* destructure with safe defaults */
  const {
    materials,
    subjects,
    study_blocks: blocks = {
      total: 0,
      completed: 0,
      skipped: 0,
      minutes_scheduled: 0,
    },
    achievements_unlocked: achievements,
  } = stats

  /* minutes → hh : mm for nicer display */
  const prettyMinutes = (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return h ? `${h}h ${m}m` : `${m}m`
  }

  // Calculate completion rates
  const materialTaggedRate = materials.total > 0 ? (materials.tagged / materials.total) * 100 : 0
  const subjectCompletionRate = subjects.topics > 0 ? (subjects.topics_completed / subjects.topics) * 100 : 0
  const blockCompletionRate = blocks.total > 0 ? (blocks.completed / blocks.total) * 100 : 0

  const totalItems = materials.total + subjects.total + blocks.total

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
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
            <div className="text-right">
              <Badge variant="outline" className="text-sm px-3 py-1">
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
        <StatCard
          icon={<FileText className="h-5 w-5 text-white" />}
          label="Celkom Materiálov"
          value={materials.total}
          gradient="from-blue-500 to-blue-600"
          delay={0}
        />
        <StatCard
          icon={<AlignJustify className="h-5 w-5 text-white" />}
          label="Súhrny"
          value={materials.summaries}
          subtitle="Automaticky generované"
          gradient="from-blue-600 to-indigo-600"
          delay={100}
        />
        <StatCard
          icon={<Tags className="h-5 w-5 text-white" />}
          label="Tagované"
          value={materials.tagged}
          progress={materialTaggedRate}
          gradient="from-indigo-600 to-purple-600"
          delay={200}
        />
        <StatCard
          icon={<BookOpenCheck className="h-5 w-5 text-white" />}
          label="Extrahované Slová"
          value={materials.words_extracted}
          subtitle="Pre lepšie vyhľadávanie"
          gradient="from-purple-600 to-pink-600"
          delay={300}
        />
      </CategorySection>

      {/* Subjects Section */}
      <CategorySection
        title="Predmety a Témy"
        icon={<GraduationCap className="h-5 w-5 text-emerald-600" />}
        badge={`${subjects.topics_completed}/${subjects.topics} hotovo`}
      >
        <StatCard
          icon={<GraduationCap className="h-5 w-5 text-white" />}
          label="Predmety"
          value={subjects.total}
          gradient="from-emerald-500 to-emerald-600"
          delay={0}
        />
        <StatCard
          icon={<Layers className="h-5 w-5 text-white" />}
          label="Témy"
          value={subjects.topics}
          gradient="from-emerald-600 to-teal-600"
          delay={100}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-white" />}
          label="Dokončené Témy"
          value={subjects.topics_completed}
          progress={subjectCompletionRate}
          gradient="from-teal-600 to-cyan-600"
          delay={200}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          label="Úspešnosť"
          value={`${Math.round(subjectCompletionRate)}%`}
          subtitle="Dokončených tém"
          gradient="from-cyan-600 to-blue-600"
          delay={300}
        />
      </CategorySection>

      {/* Study Blocks Section */}
      <CategorySection
        title="Študijné Bloky"
        icon={<Clock8 className="h-5 w-5 text-amber-600" />}
        badge={`${prettyMinutes(blocks.minutes_scheduled)} naplánované`}
      >
        <StatCard
          icon={<Clock8 className="h-5 w-5 text-white" />}
          label="Celkom Blokov"
          value={blocks.total}
          gradient="from-amber-500 to-amber-600"
          delay={0}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-white" />}
          label="Dokončené"
          value={blocks.completed}
          progress={blockCompletionRate}
          gradient="from-amber-600 to-orange-600"
          delay={100}
        />
        <StatCard
          icon={<SkipForward className="h-5 w-5 text-white" />}
          label="Preskočené"
          value={blocks.skipped}
          subtitle="Bloky na neskôr"
          gradient="from-orange-600 to-red-600"
          delay={200}
        />
        <StatCard
          icon={<Clock8 className="h-5 w-5 text-white" />}
          label="Čas Štúdia"
          value={prettyMinutes(blocks.minutes_scheduled)}
          subtitle="Naplánovaný čas"
          gradient="from-red-600 to-pink-600"
          delay={300}
        />
      </CategorySection>

      {/* Achievements Section */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-green-100">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">Achievementy</h3>
                <p className="text-green-600">Vaše úspechy a míľniky</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-700">
                <AnimatedCounter value={achievements} />
              </div>
              <div className="text-sm text-green-600">Odomknuté</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
    </div>
  )
}
