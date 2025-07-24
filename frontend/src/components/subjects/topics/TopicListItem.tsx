"use client"

import { useState } from "react"
import { type Topic, analyzeTopicNow } from "@/services/topicService"
import { useAuth } from "@/hooks/useAuth"
import { TopicStatus } from "@/types/study"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Edit3,
  Trash2,
  Brain,
  Clock4,
  CheckCircle2,
  PlayCircle,
  Circle,
  Zap,
  User,
  AlertTriangle,
  Loader2,
} from "lucide-react"

/* helper: enum → Readable */
const fmt = (v?: string | null) => (v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "N/A")

/* helper: label + colour for AI difficulty score */
const aiColour = (s?: number | null) => {
  if (s == null) return { l: "Neznáma", c: "text-gray-500", bg: "bg-gray-50 dark:bg-gray-900/20" }
  if (s <= 0.2)
    return { l: "Veľmi ľahká", c: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200" }
  if (s <= 0.4)
    return { l: "Ľahká", c: "text-lime-600", bg: "bg-lime-50 dark:bg-lime-900/20", border: "border-lime-200" }
  if (s <= 0.6)
    return { l: "Stredná", c: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200" }
  if (s <= 0.8)
    return { l: "Ťažká", c: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200" }
  return { l: "Veľmi ťažká", c: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200" }
}

/* helper: status styling */
const getStatusStyle = (status: string) => {
  switch (status) {
    case TopicStatus.COMPLETED:
      return {
        icon: CheckCircle2,
        color: "text-green-600",
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200",
        label: "Dokončené",
      }
    case TopicStatus.IN_PROGRESS:
      return {
        icon: PlayCircle,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200",
        label: "V procese",
      }
    default:
      return {
        icon: Circle,
        color: "text-slate-600",
        bg: "bg-slate-50 dark:bg-slate-900/20",
        border: "border-slate-200",
        label: "Nezačaté",
      }
  }
}

interface Props {
  topic: Topic
  onEdit: () => void
  onDelete: () => void
  onTopicUpdate: (t: Topic) => void
}

export default function TopicListItem({ topic, onEdit, onDelete, onTopicUpdate }: Props) {
  const { token } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!token) {
      alert("Najprv sa prihláste.")
      return
    }
    setLoading(true)
    try {
      const updated = await analyzeTopicNow(topic.id, token)
      onTopicUpdate(updated)
    } catch (e) {
      console.error(e)
      alert("AI analýza zlyhala")
    } finally {
      setLoading(false)
    }
  }

  const ai = aiColour(topic.ai_difficulty_score)
  const statusStyle = getStatusStyle(topic.status)
  const StatusIcon = statusStyle.icon

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-muted/40 hover:border-primary/40">
      {/* Header with Status */}
      <CardHeader className={`${statusStyle.bg} ${statusStyle.border} border-b-2 p-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold truncate mb-2">{topic.name}</CardTitle>
            <Badge className={`${statusStyle.bg} ${statusStyle.color} border-0 gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {statusStyle.label}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="hover:bg-white/50">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* AI Analysis Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Analýza
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={loading}
              className="gap-2 hover:bg-primary/10 bg-transparent"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
              {loading ? "Analyzujem..." : "Generovať"}
            </Button>
          </div>

          {/* AI Difficulty */}
          {topic.ai_difficulty_score != null && (
            <div className={`p-3 rounded-lg ${ai.bg} ${ai.border} border`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className={`h-4 w-4 ${ai.c}`} />
                  <span className="text-sm font-medium">Náročnosť</span>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${ai.c}`}>{ai.l}</div>
                  <div className="text-xs text-muted-foreground">({topic.ai_difficulty_score.toFixed(2)})</div>
                </div>
              </div>
            </div>
          )}

          {/* AI Duration */}
          {topic.ai_estimated_duration && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock4 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Odhadovaný čas</span>
                </div>
                <div className="font-bold text-blue-600">{topic.ai_estimated_duration} min</div>
              </div>
            </div>
          )}
        </div>

        {/* User Input Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4" />
            Vaše hodnotenie
          </h4>

          {/* User Difficulty */}
          {topic.user_difficulty && (
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-purple-600" />
                <span className="text-sm">
                  <span className="font-medium">Vaša náročnosť:</span>{" "}
                  <span className="font-bold text-purple-600">{fmt(topic.user_difficulty)}</span>
                </span>
              </div>
            </div>
          )}

          {/* Strengths */}
          {topic.user_strengths && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
              <div className="text-sm">
                <span className="font-semibold text-green-700 dark:text-green-300">Silné stránky:</span>
                <p className="mt-1 text-green-600 dark:text-green-400">{topic.user_strengths}</p>
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {topic.user_weaknesses && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200">
              <div className="text-sm">
                <span className="font-semibold text-red-700 dark:text-red-300">Slabé stránky:</span>
                <p className="mt-1 text-red-600 dark:text-red-400">{topic.user_weaknesses}</p>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!topic.user_difficulty &&
          topic.ai_difficulty_score == null &&
          !topic.user_strengths &&
          !topic.user_weaknesses && (
            <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg bg-muted/20">
              <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground italic">Pre túto tému neboli zadané ďalšie detaily.</p>
              <p className="text-xs text-muted-foreground mt-1">Upravte tému alebo spustite AI analýzu.</p>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
