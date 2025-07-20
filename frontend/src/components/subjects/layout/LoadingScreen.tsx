"use client"

import { Loader2, Sparkles, Star, Zap, BookOpen, Target } from "lucide-react"

export default function LoadingScreen() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Enhanced animated particles background */}
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce opacity-70"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${1.5 + Math.random() * 2}s`,
            }}
          >
            <div className="w-4 h-4 bg-gradient-to-br from-primary/90 to-secondary/90 rounded-full shadow-xl backdrop-blur-sm" />
          </div>
        ))}
      </div>

      <div className="text-center space-y-10 z-10">
        <div className="relative">
          {/* Enhanced main loading circle */}
          <div className="w-48 h-48 bg-white/30 dark:bg-black/30 backdrop-blur-3xl rounded-full flex items-center justify-center mx-auto border-4 border-white/40 shadow-2xl">
            <Loader2 className="h-24 w-24 animate-spin text-primary" />
          </div>

          {/* More floating decorations */}
          <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-secondary to-primary rounded-full animate-pulse flex items-center justify-center shadow-2xl">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce flex items-center justify-center shadow-xl">
            <Star className="h-8 w-8 text-white" />
          </div>
          <div className="absolute top-6 -left-10 w-14 h-14 bg-gradient-to-br from-green-400 to-teal-500 rounded-full animate-pulse flex items-center justify-center shadow-xl">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <div className="absolute -top-4 left-16 w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full animate-bounce flex items-center justify-center shadow-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div className="absolute bottom-8 right-12 w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full animate-pulse flex items-center justify-center shadow-lg">
            <Target className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-white/20 dark:bg-black/20 rounded-3xl p-12 border-2 border-white/30 shadow-2xl max-w-lg mx-auto">
          <h2 className="text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-6">
            Načítavam predmet
          </h2>
          <p className="text-2xl text-muted-foreground mb-8">Pripravujeme váš študijný priestor...</p>

          {/* Enhanced loading dots */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-lg"
                style={{ animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </div>

          {/* Progress text */}
          <div className="text-lg text-muted-foreground/80">
            <p className="animate-pulse">Analyzujem témy a materiály...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
