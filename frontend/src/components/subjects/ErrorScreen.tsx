"use client"

import { BookOpen, ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ErrorScreenProps {
  error?: string | null
}

export default function ErrorScreen({ error }: ErrorScreenProps) {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Error particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
        ))}
      </div>

      <div className="text-center space-y-10 max-w-2xl z-10">
        <div className="w-32 h-32 bg-white/10 dark:bg-black/10 backdrop-blur-2xl rounded-full flex items-center justify-center mx-auto border-2 border-red-200/30 shadow-2xl">
          <BookOpen className="h-16 w-16 text-destructive" />
        </div>

        <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 rounded-3xl p-12 border border-white/20 shadow-2xl">
          <h2 className="text-5xl font-bold text-destructive mb-8">Predmet sa nenašiel</h2>
          <p className="text-2xl text-muted-foreground mb-10 leading-relaxed">
            {error || "Nepodarilo sa načítať predmet"}
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="gap-4 text-lg px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-xl"
            >
              <ArrowLeft className="h-6 w-6" />
              Späť na Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
