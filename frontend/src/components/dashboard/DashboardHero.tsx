"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StatCard } from "./StatCard"
import { CreateSubjectDialog } from "./CreateSubjectDialog"
import { Sparkles, Calendar, TrendingUp, GraduationCap, BookCopy, Target, Award, ArrowRight } from 'lucide-react'
import Link from "next/link"

interface DashboardStats {
  totalSubjects: number
  totalTopics: number
  completedTopics: number
  overallProgress: number
  activeSubjects: number
}

interface DashboardHeroProps {
  userName: string
  stats: DashboardStats
  onCreateSubject: (name: string, description: string) => Promise<void>
  isSubmitting: boolean
  error: string | null
  isCreateDialogOpen: boolean
  onCreateDialogChange: (open: boolean) => void
  hasSubjects: boolean
}

export function DashboardHero({
  userName,
  stats,
  onCreateSubject,
  isSubmitting,
  error,
  isCreateDialogOpen,
  onCreateDialogChange,
  hasSubjects,
}: DashboardHeroProps) {
  return (
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
              Vitaj späť, <span className="block md:inline">{userName}! 👋</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Pripravený na ďalší krok vo svojom štúdiu? Sleduj pokrok, organizuj materiály a dosahuj svoje ciele s
              pomocou AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <CreateSubjectDialog
                isOpen={isCreateDialogOpen}
                onOpenChange={onCreateDialogChange}
                onSubmit={onCreateSubject}
                isSubmitting={isSubmitting}
                error={error}
              />

              {hasSubjects && (
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
}
