"use client"

import { FC } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BookOpenCheck,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"
import type { Subject } from "@/services/subjectService"

interface SubjectOverviewProps {
  subject: Subject & {
    topics?: { id: number; status: string }[]
  }
}

const SubjectOverview: FC<SubjectOverviewProps> = ({ subject }) => {
  // compute some stats
  const totalTopics = subject.topics?.length ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedTopics = subject.topics?.filter(t => t.status === "COMPLETED" as any).length ?? 0
  const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-3xl md:text-4xl font-bold">
          {subject.name}
        </CardTitle>
        {subject.description && (
          <CardDescription className="text-lg mt-2">
            {subject.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6 pt-4">
        {/* small badges */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="outline" className="flex items-center gap-1">
            <BookOpenCheck className="h-4 w-4" /> {totalTopics} témy
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> {completedTopics} dokončené
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> {progress} %
          </Badge>
        </div>

        {/* progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Dokončenie</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export default SubjectOverview
