"use client"

import { CreateSubjectDialog } from "./CreateSubjectDialog"
import { BookOpenCheck, Sparkles, Zap, Users, BarChart3, Target } from 'lucide-react'

interface EmptyStateProps {
  onCreateSubject: (name: string, description: string) => Promise<void>
  isSubmitting: boolean
  error: string | null
  isCreateDialogOpen: boolean
  onCreateDialogChange: (open: boolean) => void
}

export function EmptyState({
  onCreateSubject,
  isSubmitting,
  error,
  isCreateDialogOpen,
  onCreateDialogChange,
}: EmptyStateProps) {
  return (
    <div className="text-center py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-3xl"></div>
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mb-4">
            <BookOpenCheck className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute -top-2 -right-8 w-12 h-12 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-secondary" />
          </div>
          <div className="absolute -bottom-2 -left-8 w-8 h-8 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Začni svoju študijnú cestu! 🚀
        </h2>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-lg mx-auto">
          Zatiaľ nemáš pridané žiadne predmety. Vytvor svoj prvý predmet a začni organizovať svoje štúdium s pomocou AI
          asistenta.
        </p>

        <div className="space-y-4">
          <CreateSubjectDialog
            isOpen={isCreateDialogOpen}
            onOpenChange={onCreateDialogChange}
            onSubmit={onCreateSubject}
            isSubmitting={isSubmitting}
            error={error}
            triggerText="Pridať Prvý Predmet"
          />

          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>AI asistent</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Sledovanie pokroku</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Achievementy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
