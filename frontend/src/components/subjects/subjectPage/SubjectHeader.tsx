"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowLeft, BookOpen, Calendar, Users, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import type { FC } from "react"

interface Props {
  error?: string | null
  subjectName?: string
  isLoading?: boolean
}

const SubjectHeader: FC<Props> = ({ error, subjectName, isLoading = false }) => {
  const router = useRouter()

  return (
    <div className="mb-8">
      {/* Navigation and Title Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Left side - Navigation and Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="gap-2 hover:bg-primary/10 transition-colors"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isLoading ? "Načítavam..." : subjectName || "Detail Predmetu"}
              </h1>
              <p className="text-sm text-muted-foreground">Spravujte témy, plány a materiály</p>
            </div>
          </div>
        </div>

        {/* Right side - Quick Info Badges */}
        {!error && !isLoading && (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
              <Calendar className="h-3 w-3" />
              Aktívny predmet
            </Badge>
            <Badge variant="outline" className="gap-2 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
              <Users className="h-3 w-3" />
              AI asistent
            </Badge>
            <Badge variant="outline" className="gap-2 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Smart štúdium
            </Badge>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-2 border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Nastala chyba pri načítavaní predmetu</AlertTitle>
          <AlertDescription className="text-base mt-2">{error}</AlertDescription>
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="bg-white dark:bg-black"
            >
              Skúsiť znovu
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Späť na Dashboard
            </Button>
          </div>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-muted-foreground/20">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="font-medium">Načítavam predmet...</p>
              <p className="text-sm text-muted-foreground">Pripravujeme váš študijný priestor</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubjectHeader
