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
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-b border-border/50 shadow-lg">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10">
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Dashboard</span>
              </Button>
            </Link>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {subject.name.charAt(0)}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-2 w-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{subject.name}</h1>
                <p className="text-sm text-muted-foreground">Študijný predmet</p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2 px-3 py-1 text-sm">
              <Target className="h-3 w-3" />
              {completedTopics}/{totalTopics} tém
            </Badge>
            <Badge variant="outline" className="gap-2 px-3 py-1 text-sm">
              <BarChart3 className="h-3 w-3" />
              {progressPercentage}% pokrok
            </Badge>
            {isCompleted && (
              <Badge className="gap-2 px-3 py-1 text-sm bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 animate-pulse">
                <Sparkles className="h-3 w-3" />
                Dokončené!
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
