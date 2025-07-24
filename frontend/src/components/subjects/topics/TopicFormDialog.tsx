"use client"

import { useState, useEffect, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  BookOpen,
  Target,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  Circle,
  User,
  Sparkles,
  Brain,
  Heart,
  AlertCircle,
} from "lucide-react"
import type { Topic, TopicCreate, TopicUpdate } from "@/services/topicService"
import { TopicStatus, UserDifficulty } from "@/types/study"

const NONE_VALUE_PLACEHOLDER = "_none_"

const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return ""
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

interface TopicFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  editingTopic: Topic | null
  subjectName: string | undefined
  onSubmit: (data: TopicCreate | TopicUpdate, editingTopicId?: number) => Promise<void>
  isSubmitting: boolean
}

export default function TopicFormDialog({
  isOpen,
  onOpenChange,
  editingTopic,
  subjectName,
  onSubmit,
  isSubmitting,
}: TopicFormDialogProps) {
  const [topicName, setTopicName] = useState("")
  const [topicUserStrengths, setTopicUserStrengths] = useState("")
  const [topicUserWeaknesses, setTopicUserWeaknesses] = useState("")
  const [topicUserDifficulty, setTopicUserDifficulty] = useState<UserDifficulty | typeof NONE_VALUE_PLACEHOLDER>(
    NONE_VALUE_PLACEHOLDER,
  )
  const [topicStatus, setTopicStatus] = useState<TopicStatus>(TopicStatus.NOT_STARTED)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (editingTopic) {
        setTopicName(editingTopic.name)
        setTopicUserStrengths(editingTopic.user_strengths || "")
        setTopicUserWeaknesses(editingTopic.user_weaknesses || "")
        setTopicUserDifficulty(editingTopic.user_difficulty || NONE_VALUE_PLACEHOLDER)
        setTopicStatus(editingTopic.status)
      } else {
        setTopicName("")
        setTopicUserStrengths("")
        setTopicUserWeaknesses("")
        setTopicUserDifficulty(NONE_VALUE_PLACEHOLDER)
        setTopicStatus(TopicStatus.NOT_STARTED)
      }
      setFormError(null)
    }
  }, [isOpen, editingTopic])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!topicName.trim()) {
      setFormError("Názov témy je povinný.")
      return
    }
    setFormError(null)

    const difficultyToSend = topicUserDifficulty === NONE_VALUE_PLACEHOLDER ? undefined : topicUserDifficulty
    const commonData = {
      name: topicName.trim(),
      user_strengths: topicUserStrengths.trim() || undefined,
      user_weaknesses: topicUserWeaknesses.trim() || undefined,
      user_difficulty: difficultyToSend,
      status: topicStatus,
    }

    if (editingTopic) {
      const updateData: TopicUpdate = { ...commonData }
      if (!topicUserStrengths.trim()) updateData.user_strengths = null
      if (!topicUserWeaknesses.trim()) updateData.user_weaknesses = null
      if (topicUserDifficulty === NONE_VALUE_PLACEHOLDER) updateData.user_difficulty = null
      await onSubmit(updateData, editingTopic.id)
    } else {
      const createData: TopicCreate = { ...commonData }
      if (!createData.status) createData.status = TopicStatus.NOT_STARTED
      await onSubmit(createData)
    }
  }

  const getDifficultyStyle = (difficulty: UserDifficulty | typeof NONE_VALUE_PLACEHOLDER) => {
    switch (difficulty) {
      case UserDifficulty.EASY:
        return {
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200",
          icon: "🟢",
        }
      case UserDifficulty.MEDIUM:
        return {
          color: "text-yellow-600 dark:text-yellow-400",
          bg: "bg-yellow-50 dark:bg-yellow-900/20",
          border: "border-yellow-200",
          icon: "🟡",
        }
      case UserDifficulty.HARD:
        return {
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200",
          icon: "🔴",
        }
      default:
        return {
          color: "text-muted-foreground",
          bg: "bg-muted/20",
          border: "border-muted",
          icon: "⚪",
        }
    }
  }

  const getStatusStyle = (status: TopicStatus) => {
    switch (status) {
      case TopicStatus.COMPLETED:
        return {
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200",
          icon: CheckCircle2,
        }
      case TopicStatus.IN_PROGRESS:
        return {
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200",
          icon: PlayCircle,
        }
      default:
        return {
          color: "text-muted-foreground",
          bg: "bg-muted/20",
          border: "border-muted",
          icon: Circle,
        }
    }
  }

  const difficultyStyle = getDifficultyStyle(topicUserDifficulty)
  const statusStyle = getStatusStyle(topicStatus)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {/* Enhanced Header */}
        <DialogHeader className="space-y-4 pb-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 shadow-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {editingTopic ? "Upraviť tému" : "Pridať novú tému"}
              </DialogTitle>
              {subjectName && (
                <DialogDescription className="text-base text-muted-foreground mt-1">
                  {editingTopic
                    ? `Upravujete tému "${editingTopic.name}"`
                    : `Pridávate novú tému k predmetu "${subjectName}"`}
                </DialogDescription>
              )}
            </div>
            {editingTopic && (
              <Badge variant="outline" className="gap-2">
                <Sparkles className="h-3 w-3" />
                Úprava
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Error Alert */}
        {formError && (
          <Card className="border-2 border-destructive/20 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive font-medium">{formError}</p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Topic Name */}
          <div className="space-y-3">
            <Label htmlFor="topicNameDialog" className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Názov témy <span className="text-destructive">*</span>
            </Label>
            <Input
              id="topicNameDialog"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              required
              placeholder="Napr. Limity a spojitosť funkcií"
              className="h-12 text-base border-2 focus:border-primary/50"
            />
          </div>

          {/* Status and Difficulty Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status */}
            <div className="space-y-3">
              <Label htmlFor="topicStatusDialog" className="text-base font-semibold flex items-center gap-2">
                <statusStyle.icon className="h-4 w-4 text-primary" />
                Status témy
              </Label>
              <Select value={topicStatus} onValueChange={(value) => setTopicStatus(value as TopicStatus)}>
                <SelectTrigger
                  id="topicStatusDialog"
                  className={`h-12 border-2 ${statusStyle.border} ${statusStyle.bg}`}
                >
                  <SelectValue placeholder="Vyberte status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TopicStatus).map((sVal) => {
                    const style = getStatusStyle(sVal)
                    const StatusIcon = style.icon
                    return (
                      <SelectItem key={sVal} value={sVal}>
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`h-4 w-4 ${style.color}`} />
                          <span className="font-medium">{formatEnumValue(sVal)}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-3">
              <Label htmlFor="topicUserDifficultyDialog" className="text-base font-semibold flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Vnímaná náročnosť
              </Label>
              <Select
                value={topicUserDifficulty}
                onValueChange={(value) =>
                  setTopicUserDifficulty(value as UserDifficulty | typeof NONE_VALUE_PLACEHOLDER)
                }
              >
                <SelectTrigger
                  id="topicUserDifficultyDialog"
                  className={`h-12 border-2 ${difficultyStyle.border} ${difficultyStyle.bg}`}
                >
                  <SelectValue placeholder="Vyberte náročnosť" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE_PLACEHOLDER}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">⚪</span>
                      <span className="text-muted-foreground">Žiadna</span>
                    </div>
                  </SelectItem>
                  {Object.values(UserDifficulty).map((dVal) => {
                    const style = getDifficultyStyle(dVal)
                    return (
                      <SelectItem key={dVal} value={dVal}>
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{style.icon}</span>
                          <span className={`font-medium ${style.color}`}>{formatEnumValue(dVal)}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Vaše hodnotenie</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="space-y-3">
                <Label
                  htmlFor="topicUserStrengthsDialog"
                  className="text-base font-semibold flex items-center gap-2 text-green-700 dark:text-green-400"
                >
                  <Heart className="h-4 w-4" />
                  Silné stránky
                </Label>
                <Card className="border-2 border-green-200 bg-green-50/50 dark:bg-green-900/10">
                  <CardContent className="p-4">
                    <Textarea
                      id="topicUserStrengthsDialog"
                      value={topicUserStrengths}
                      onChange={(e) => setTopicUserStrengths(e.target.value)}
                      placeholder="Čo ti v tejto téme ide dobre? Aké máš skúsenosti?"
                      rows={4}
                      className="resize-none border-0 bg-transparent focus-visible:ring-0 text-base"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Weaknesses */}
              <div className="space-y-3">
                <Label
                  htmlFor="topicUserWeaknessesDialog"
                  className="text-base font-semibold flex items-center gap-2 text-red-700 dark:text-red-400"
                >
                  <AlertCircle className="h-4 w-4" />
                  Slabé stránky
                </Label>
                <Card className="border-2 border-red-200 bg-red-50/50 dark:bg-red-900/10">
                  <CardContent className="p-4">
                    <Textarea
                      id="topicUserWeaknessesDialog"
                      value={topicUserWeaknesses}
                      onChange={(e) => setTopicUserWeaknesses(e.target.value)}
                      placeholder="S čím máš v tejto téme problémy? Čo ti robí ťažkosti?"
                      rows={4}
                      className="resize-none border-0 bg-transparent focus-visible:ring-0 text-base"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Enhanced Footer */}
          <DialogFooter className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border/50">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                className="w-full sm:w-auto h-12 text-base bg-transparent"
              >
                Zrušiť
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || !topicName.trim()}
              className="w-full sm:w-auto h-12 text-base bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTopic ? "Uložiť zmeny" : "Vytvoriť tému"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
