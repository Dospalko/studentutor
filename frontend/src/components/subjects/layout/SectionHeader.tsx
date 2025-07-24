"use client"

import type React from "react"

interface SectionHeaderProps {
  icon: React.ReactNode
  badge: string
  title: string
  description: string
  badgeColor: string
}

export default function SectionHeader({
  icon,
  badge,
  title,
  description,
  badgeColor,
}: SectionHeaderProps) {
  return (
    <div className="text-center mb-12">
      <div
        className={`inline-flex items-center gap-3 bg-white/20 dark:bg-black/20 backdrop-blur-xl px-6 py-3 rounded-full mb-6 border border-white/30 shadow-lg`}
      >
        {icon}
        <span className={`${badgeColor} font-semibold text-sm`}>{badge}</span>
      </div>
      <h2 className="text-4xl font-bold mb-4 leading-tight">
        <span className="bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
          {title}
        </span>
      </h2>
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  )
}
