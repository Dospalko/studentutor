"use client"

import { Loader2, Sparkles, Star, Zap } from "lucide-react"

export default function LoadingScreen() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated particles background */}
      <div className="absolute inset-0">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          >
            <div className="w-3 h-3 bg-gradient-to-br from-primary/80 to-secondary/80 rounded-full shadow-lg" />
          </div>
        ))}
      </div>

      <div className="text-center space-y-8 z-10">
        <div className="relative">
          {/* Main loading circle */}
          <div className="w-40 h-40 bg-white/20 dark:bg-black/20 backdrop-blur-2xl rounded-full flex items-center justify-center mx-auto border-2 border-white/30 shadow-2xl">
            <Loader2 className="h-20 w-20 animate-spin text-primary" />
          </div>

          {/* Floating decorations */}
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br from-secondary to-primary rounded-full animate-pulse flex items-center justify-center shadow-xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-bounce flex items-center justify-center shadow-lg">
            <Star className="h-6 w-6 text-white" />
          </div>
          <div className="absolute top-4 -left-8 w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full animate-pulse flex items-center justify-center shadow-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 rounded-3xl p-10 border border-white/20 shadow-2xl max-w-md mx-auto">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            Načítavam predmet
          </h2>
          <p className="text-xl text-muted-foreground">Pripravujeme váš študijný priestor...</p>

          {/* Loading dots */}
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
