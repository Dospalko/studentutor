"use client"

import { Star, Circle, Triangle } from 'lucide-react'

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-blue-900/30 dark:to-purple-900/30" />
      
      {/* Animated floating shapes */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 6}s`,
            }}
          >
            {i % 4 === 0 && <div className="w-6 h-6 bg-gradient-to-br from-blue-400/60 to-blue-600/60 rounded-full shadow-lg" />}
            {i % 4 === 1 && <div className="w-4 h-4 bg-gradient-to-br from-purple-400/60 to-purple-600/60 rotate-45 shadow-lg" />}
            {i % 4 === 2 && <Star className="w-5 h-5 text-amber-400/60 drop-shadow-lg" />}
            {i % 4 === 3 && <Circle className="w-3 h-3 text-green-400/60 drop-shadow-lg" />}
          </div>
        ))}
      </div>

      {/* Large decorative blobs */}
      <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
      <div 
        className="absolute -bottom-60 -left-60 w-[400px] h-[400px] bg-gradient-to-tr from-pink-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "3s" }}
      />
      <div 
        className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-gradient-to-r from-green-400/20 to-teal-500/20 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "6s" }}
      />

      {/* Moving gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); 
          }
          25% { 
            transform: translateY(-20px) translateX(10px) rotate(90deg) scale(1.1); 
          }
          50% { 
            transform: translateY(-10px) translateX(-15px) rotate(180deg) scale(0.9); 
          }
          75% { 
            transform: translateY(15px) translateX(5px) rotate(270deg) scale(1.05); 
          }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
