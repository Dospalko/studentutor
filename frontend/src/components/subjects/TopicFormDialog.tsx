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
import { Loader2, BookOpen, Target, TrendingUp, AlertTriangle } from "lucide-react"
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

  const getDifficultyColor = (difficulty: UserDifficulty | typeof NONE_VALUE_PLACEHOLDER) => {
    switch (difficulty) {
      case UserDifficulty.EASY:
        return "text-green-600 dark:text-green-400"
      case UserDifficulty.MEDIUM:
        return "text-yellow-600 dark:text-yellow-400"
      case UserDifficulty.HARD:
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusColor = (status: TopicStatus) => {
    switch (status) {
      case TopicStatus.COMPLETED:
        return "text-green-600 dark:text-green-400"
      case TopicStatus.IN_PROGRESS:
        return "text-blue-600 dark:text-blue-400"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {editingTopic ? "Upraviť tému" : "Pridať novú tému"}
              </DialogTitle>
              {subjectName && (
                <DialogDescription className="text-sm text-muted-foreground">
                  {editingTopic
                    ? `Upravujete tému "${editingTopic.name}"`
                    : `Pridávate novú tému k predmetu "${subjectName}"`}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {formError && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{formError}</p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topicNameDialog" className="text-sm font-medium">
              Názov témy <span className="text-destructive">*</span>
            </Label>
            <Input
              id="topicNameDialog"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              required
              placeholder="Napr. Limity a spojitosť funkcií"
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topicStatusDialog" className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Status
              </Label>
              <Select value={topicStatus} onValueChange={(value) => setTopicStatus(value as TopicStatus)}>
                <SelectTrigger id="topicStatusDialog" className="h-11">
                  <SelectValue placeholder="Vyberte status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TopicStatus).map((sVal) => (
                    <SelectItem key={sVal} value={sVal}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(sVal)}`}></span>
                        {formatEnumValue(sVal)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topicUserDifficultyDialog" className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Vnímaná náročnosť
              </Label>
              <Select
                value={topicUserDifficulty}
                onValueChange={(value) =>
                  setTopicUserDifficulty(value as UserDifficulty | typeof NONE_VALUE_PLACEHOLDER)
                }
              >
                <SelectTrigger id="topicUserDifficultyDialog" className="h-11">
                  <SelectValue placeholder="Vyberte náročnosť" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE_PLACEHOLDER}>
                    <span className="text-muted-foreground">Žiadna</span>
                  </SelectItem>
                  {Object.values(UserDifficulty).map((dVal) => (
                    <SelectItem key={dVal} value={dVal}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getDifficultyColor(dVal)}`}></span>
                        {formatEnumValue(dVal)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="topicUserStrengthsDialog"
                className="text-sm font-medium text-green-700 dark:text-green-400"
              >
                Silné stránky
              </Label>
              <Textarea
                id="topicUserStrengthsDialog"
                value={topicUserStrengths}
                onChange={(e) => setTopicUserStrengths(e.target.value)}
                placeholder="Čo ti v tejto téme ide dobre?"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topicUserWeaknessesDialog" className="text-sm font-medium text-red-700 dark:text-red-400">
                Slabé stránky
              </Label>
              <Textarea
                id="topicUserWeaknessesDialog"
                value={topicUserWeaknesses}
                onChange={(e) => setTopicUserWeaknesses(e.target.value)}
                placeholder="S čím máš v tejto téme problémy?"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting} className="w-full sm:w-auto">
                Zrušiť
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !topicName.trim()} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTopic ? "Uložiť zmeny" : "Vytvoriť tému"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
