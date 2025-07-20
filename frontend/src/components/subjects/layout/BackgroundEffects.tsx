"use client"

import { Star, Circle, Sparkles, Zap } from "lucide-react"

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0  overflow-hidden">
      {/* VIBRANT Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-slate-800 dark:via-blue-900 dark:to-purple-900" />

      {/* Additional gradient layers for depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50/80 via-transparent to-amber-50/80 dark:from-emerald-900/30 dark:via-transparent dark:to-amber-900/30" />
      <div className="absolute inset-0 bg-gradient-to-bl from-rose-50/60 via-transparent to-cyan-50/60 dark:from-rose-900/20 dark:via-transparent dark:to-cyan-900/20" />

      {/* MORE VISIBLE floating shapes */}
      <div className="absolute inset-0">
        {[...Array(35)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 6}s`,
            }}
          >
            {i % 6 === 0 && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400/70 to-blue-600/70 rounded-full shadow-xl backdrop-blur-sm" />
            )}
            {i % 6 === 1 && (
              <div className="w-6 h-6 bg-gradient-to-br from-purple-400/70 to-purple-600/70 rotate-45 shadow-lg backdrop-blur-sm" />
            )}
            {i % 6 === 2 && <Star className="w-7 h-7 text-amber-400/80 drop-shadow-lg" />}
            {i % 6 === 3 && <Circle className="w-5 h-5 text-green-400/70 drop-shadow-lg" />}
            {i % 6 === 4 && <Sparkles className="w-6 h-6 text-pink-400/70 drop-shadow-lg" />}
            {i % 6 === 5 && <Zap className="w-5 h-5 text-cyan-400/70 drop-shadow-lg" />}
          </div>
        ))}
      </div>

      {/* MUCH MORE VISIBLE decorative blobs */}
      <div className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/40 to-purple-500/40 rounded-full blur-3xl animate-pulse shadow-2xl" />
      <div
        className="absolute -bottom-60 -left-60 w-[700px] h-[700px] bg-gradient-to-tr from-pink-400/35 to-orange-500/35 rounded-full blur-3xl animate-pulse shadow-2xl"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-green-400/30 to-teal-500/30 rounded-full blur-2xl animate-pulse shadow-xl"
        style={{ animationDelay: "6s" }}
      />
      <div
        className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] bg-gradient-to-r from-amber-400/25 to-yellow-500/25 rounded-full blur-2xl animate-pulse shadow-xl"
        style={{ animationDelay: "9s" }}
      />

      {/* Moving gradient overlays for shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      <div
        className="absolute inset-0 bg-gradient-to-l from-transparent via-blue-200/5 to-transparent animate-shimmer"
        style={{ animationDelay: "5s" }}
      />

      {/* More visible grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); 
          }
          25% { 
            transform: translateY(-25px) translateX(15px) rotate(90deg) scale(1.1); 
          }
          50% { 
            transform: translateY(-15px) translateX(-20px) rotate(180deg) scale(0.9); 
          }
          75% { 
            transform: translateY(20px) translateX(10px) rotate(270deg) scale(1.05); 
          }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
