"use client"

import { Star, Circle } from "lucide-react"

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient - FIXED colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/30 dark:to-purple-900/30" />

      {/* Animated floating shapes - SMALLER and more subtle */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          >
            {i % 4 === 0 && <div className="w-3 h-3 bg-gradient-to-br from-blue-400/40 to-blue-600/40 rounded-full" />}
            {i % 4 === 1 && <div className="w-2 h-2 bg-gradient-to-br from-purple-400/40 to-purple-600/40 rotate-45" />}
            {i % 4 === 2 && <Star className="w-4 h-4 text-amber-400/30" />}
            {i % 4 === 3 && <Circle className="w-2 h-2 text-green-400/30" />}
          </div>
        ))}
      </div>

      {/* Large decorative blobs - MORE SUBTLE */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-pink-400/10 to-orange-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-green-400/8 to-teal-500/8 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "6s" }}
      />

      {/* Grid pattern - VERY SUBTLE */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "50px 50px",
        }}
      />

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg); 
          }
          25% { 
            transform: translateY(-10px) translateX(5px) rotate(90deg); 
          }
          50% { 
            transform: translateY(-5px) translateX(-8px) rotate(180deg); 
          }
          75% { 
            transform: translateY(8px) translateX(3px) rotate(270deg); 
          }
        }
        
        .animate-float {
          animation: float 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
