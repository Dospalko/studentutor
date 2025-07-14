"use client"

import type React from "react"
import { AnimatedCounter } from "./AnimatedCounter"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  subtitle?: string
  gradient: string
  delay?: number
}

export function StatCard({ icon, label, value, subtitle, gradient, delay = 0 }: StatCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${gradient} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">{icon}</div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
            </div>
            <div className="text-sm text-white/80 font-medium">{label}</div>
          </div>
        </div>
        {subtitle && <div className="text-xs text-white/70">{subtitle}</div>}
      </div>
    </div>
  )
}
