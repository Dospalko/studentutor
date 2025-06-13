"use client"

import type { Topic } from "@/services/topicService"
import { TopicStatus } from "@/types/study"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit3, Trash2, CheckCircle2, Clock, AlertTriangle, TrendingUp, Target } from "lucide-react"

const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return ""
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

interface TopicListItemProps {
  topic: Topic
  onEdit: () => void
  onDelete: () => void
}

export default function TopicListItem({ topic, onEdit, onDelete }: TopicListItemProps) {
  const getStatusIcon = (status: TopicStatus) => {
    switch (status) {
      case TopicStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4" />
      case TopicStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: TopicStatus) => {
    switch (status) {
      case TopicStatus.COMPLETED:
        return "bg-green-500 hover:bg-green-600 text-white border-green-500"
      case TopicStatus.IN_PROGRESS:
        return "bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
      case TopicStatus.NEEDS_REVIEW:
        return "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500"
      default:
        return "border-muted-foreground/20 text-muted-foreground"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "text-green-600 dark:text-green-400"
      case "medium":
        return "text-yellow-600 dark:text-yellow-400"
      case "hard":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border-muted/40 hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">{topic.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={`text-xs font-medium ${getStatusColor(topic.status)}`}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(topic.status)}
                  {formatEnumValue(topic.status)}
                </span>
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              aria-label={`Upraviť tému ${topic.name}`}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
              aria-label={`Zmazať tému ${topic.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {topic.user_difficulty && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Náročnosť:</span>
            <span className={`font-medium ${getDifficultyColor(topic.user_difficulty)}`}>
              {formatEnumValue(topic.user_difficulty)}
            </span>
          </div>
        )}

        {topic.user_strengths && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Silné stránky</p>
                <p className="text-sm text-green-800 dark:text-green-200">{topic.user_strengths}</p>
              </div>
            </div>
          </div>
        )}

        {topic.user_weaknesses && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Slabé stránky</p>
                <p className="text-sm text-red-800 dark:text-red-200">{topic.user_weaknesses}</p>
              </div>
            </div>
          </div>
        )}

        {!topic.user_difficulty && !topic.user_strengths && !topic.user_weaknesses && (
          <div className="p-3 rounded-lg bg-muted/30 border border-dashed border-muted">
            <p className="text-xs text-muted-foreground italic text-center">
              Pre túto tému neboli zadané žiadne ďalšie detaily.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
