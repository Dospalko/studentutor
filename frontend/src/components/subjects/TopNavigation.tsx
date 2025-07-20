"use client"

import { ArrowLeft, Target, BarChart3, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TopNavigationProps {
  subject: any
  completedTopics: number
  totalTopics: number
  progressPercentage: number
  isCompleted: boolean
}

export default function TopNavigation({
  subject,
  completedTopics,
  totalTopics,
  progressPercentage,
  isCompleted,
}: TopNavigationProps) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border-b border-white/20 shadow-xl">
      <div className="w-full px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left side */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="lg"
                className="gap-3 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm border border-white/10 shadow-lg"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </Button>
            </Link>

            <div className="h-10 w-px bg-white/30" />

            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary via-secondary to-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-2xl border-2 border-white/20">
                  {subject.name.charAt(0)}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  {subject.name}
                </h1>
                <p className="text-muted-foreground text-lg">Študijný predmet</p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Badge
              variant="outline"
              className="gap-2 px-6 py-3 text-base backdrop-blur-sm bg-white/20 dark:bg-black/20 border-white/30 shadow-lg"
            >
              <Target className="h-5 w-5" />
              {completedTopics}/{totalTopics} tém
            </Badge>
            <Badge
              variant="outline"
              className="gap-2 px-6 py-3 text-base backdrop-blur-sm bg-white/20 dark:bg-black/20 border-white/30 shadow-lg"
            >
              <BarChart3 className="h-5 w-5" />
              {progressPercentage}% pokrok
            </Badge>
            {isCompleted && (
              <Badge className="gap-2 px-6 py-3 text-base bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-xl animate-pulse">
                <Sparkles className="h-5 w-5" />
                Dokončené!
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
