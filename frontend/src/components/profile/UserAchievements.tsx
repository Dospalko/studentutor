"use client"

import { useEffect, useState, useContext } from "react"
import { Award, Star, Trophy, ShieldAlert, BookPlus, Library, CheckCircle, GraduationCap, ListChecks, Loader2, Zap, RefreshCcw, FileArchive, PieChart, Cog, Timer, Database, Edit3, BrainCog, Target, Sparkles } from 'lucide-react'
import { AuthContext } from "@/context/AuthContext"
import {
  Achievement,
  UserAchievement,
  getAllDefinedAchievements,
  getMyAchievements,
} from "@/services/achievementService"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const iconMap: { [key: string]: React.ElementType } = {
  BookPlus,
  Library,
  CheckCircle,
  GraduationCap,
  ListChecks,
  Zap,
  RefreshCcw,
  FileArchive,
  PieChart,
  Trophy,
  Cog,
  Database,
  Timer,
  Edit3,
  BrainCog,
  Target,
  Award,
  Star,
  ShieldAlert,
}

const formatEnumValue = (value: string | undefined | null): string => {
  if (!value || typeof value !== "string") return "N/A"
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

const AchievementCard = ({
  achievement,
  isAchieved,
  userAchievement,
  delay = 0,
}: {
  achievement: Achievement
  isAchieved: boolean
  userAchievement?: UserAchievement
  delay?: number
}) => {
  const IconComponent = (achievement.icon_name && iconMap[achievement.icon_name]) ? iconMap[achievement.icon_name] : Star

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-105 cursor-default ${
              isAchieved
                ? "bg-gradient-to-br from-amber-400/20 to-yellow-500/20 border-amber-300 shadow-lg hover:shadow-amber-400/40 hover:from-amber-400/30 hover:to-yellow-500/30"
                : "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border-slate-300 dark:border-slate-600 opacity-60 hover:opacity-100"
            }`}
            style={{ animationDelay: `${delay}ms` }}
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 p-4 flex flex-col items-center justify-center aspect-square">
              <div
                className={`mb-3 p-3 rounded-full transition-all duration-300 ${
                  isAchieved
                    ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-lg group-hover:shadow-amber-400/50"
                    : "bg-slate-200 dark:bg-slate-700 text-muted-foreground"
                }`}
              >
                <IconComponent className="h-6 w-6" />
              </div>
              <h4
                className={`text-sm font-semibold text-center leading-tight mb-1 ${
                  isAchieved ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"
                }`}
              >
                {achievement.name}
              </h4>
              {isAchieved && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Získané!
                </Badge>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-background text-foreground border shadow-xl">
          <div className="space-y-2">
            <p className="font-semibold text-primary">{achievement.name}</p>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
            {isAchieved && userAchievement && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ Získané:{" "}
                  {new Date(userAchievement.achieved_at).toLocaleDateString("sk-SK", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
            {!isAchieved && achievement.criteria_type && achievement.criteria_value && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground italic">
                  Kritérium: {formatEnumValue(achievement.criteria_type)} ({achievement.criteria_value})
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function UserAchievements() {
  const authContext = useContext(AuthContext)
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [myAchievements, setMyAchievements] = useState<UserAchievement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authContext?.token) {
      setIsLoading(true)
      setError(null)
      Promise.all([getAllDefinedAchievements(authContext.token), getMyAchievements(authContext.token)])
        .then(([definedAch, userAch]) => {
          setAllAchievements(definedAch.sort((a, b) => a.name.localeCompare(b.name)))
          setMyAchievements(userAch)
        })
        .catch((err) => {
          console.error("Error fetching achievements:", err)
          setError((err as Error).message || "Nepodarilo sa načítať úspechy.")
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [authContext?.token])

  const myAchievementIds = new Set(myAchievements.map((ua) => ua.achievement_id))
  const achievedCount = myAchievements.length
  const totalCount = allAchievements.length
  const completionRate = totalCount > 0 ? (achievedCount / totalCount) * 100 : 0

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Moje Úspechy a Odznaky</h3>
              <p className="text-sm text-muted-foreground">Vaše dosiahnuté míľniky</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <p className="text-muted-foreground">Načítavam úspechy...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <Trophy className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Moje Úspechy a Odznaky</h3>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30">
            <Trophy className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Moje Úspechy a Odznaky</h3>
            <p className="text-sm text-muted-foreground">Vaše dosiahnuté míľniky a pokrok</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-600">
            {achievedCount}/{totalCount}
          </div>
          <div className="text-xs text-muted-foreground">Dokončené</div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Celkový pokrok</span>
            <span className="font-medium">{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
      )}

      {/* Achievements Grid */}
      {allAchievements.length === 0 && !isLoading ? (
        <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Zatiaľ žiadne definované achievementy. Začni používať aplikáciu a sleduj, ako sa odomykajú!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {allAchievements.map((achDef, index) => {
            const achieved = myAchievementIds.has(achDef.id)
            const userAchInstance = achieved
              ? myAchievements.find((ua) => ua.achievement_id === achDef.id)
              : undefined

            return (
              <AchievementCard
                key={achDef.id}
                achievement={achDef}
                isAchieved={achieved}
                userAchievement={userAchInstance}
                delay={index * 50}
              />
            )
          })}
        </div>
      )}

      {/* Footer Tip */}
      {allAchievements.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            💡 Prejdi myšou ponad odznak pre viac detailov a dátum získania
          </p>
        </div>
      )}
    </div>
  )
}
