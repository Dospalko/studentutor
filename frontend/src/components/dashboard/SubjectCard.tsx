"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Trash2, ExternalLink, BookCopy, Clock, Star, Target, ArrowRight } from "lucide-react"
import type { Subject } from "@/services/subjectService"
import { TopicStatus } from "@/types/study"

interface SubjectCardProps {
  subject: Subject
  onDelete: (subjectId: number) => void
  index: number
}

export function SubjectCard({ subject, onDelete, index }: SubjectCardProps) {
  const calculateProgress = (): number => {
    if (!subject.topics || subject.topics.length === 0) return 0
    const completedTopics = subject.topics.filter((t) => t.status === TopicStatus.COMPLETED).length
    return Math.round((completedTopics / subject.topics.length) * 100)
  }

  const progress = calculateProgress()
  const uncompletedTopicsCount = subject.topics
    ? subject.topics.filter((t) => t.status !== TopicStatus.COMPLETED).length
    : 0
  const isCompleted = progress === 100

  return (
    <Card
      className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 ease-out hover:scale-[1.02] border-muted/40 hover:border-primary/40 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="pb-4 relative z-10">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-primary hover:text-primary/80 transition-colors line-clamp-2 mb-2">
              <Link href={`/subjects/${subject.id}`} className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 flex-shrink-0" />
                {subject.name}
              </Link>
            </CardTitle>
            {subject.description && (
              <CardDescription className="text-sm line-clamp-3 leading-relaxed">{subject.description}</CardDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(subject.id)}
            className="text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Zmazať predmet</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-6 relative z-10">
        {/* Progress section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Pokrok</span>
            <Badge
              variant={isCompleted ? "default" : progress > 50 ? "secondary" : "outline"}
              className={
                isCompleted
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : progress > 50
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : ""
              }
            >
              {progress}%
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <BookCopy className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm font-bold text-blue-700 dark:text-blue-300">{subject.topics?.length || 0}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">tém</div>
            </div>
          </div>

          {uncompletedTopicsCount > 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Clock className="h-4 w-4 text-amber-600" />
              <div>
                <div className="text-sm font-bold text-amber-700 dark:text-amber-300">{uncompletedTopicsCount}</div>
                <div className="text-xs text-amber-600 dark:text-amber-400">zostáva</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Star className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm font-bold text-green-700 dark:text-green-300">100%</div>
                <div className="text-xs text-green-600 dark:text-green-400">hotovo</div>
              </div>
            </div>
          )}
        </div>

      
      </CardContent>

      <CardFooter className="pt-4 relative z-10">
        <Link href={`/subjects/${subject.id}`} className="w-full">
          <Button
            variant="outline"
            className="w-full group bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 border-primary/20 hover:border-primary/40 transition-all duration-300"
          >
            <ExternalLink className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            Otvoriť Predmet
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
