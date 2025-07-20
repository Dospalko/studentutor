"use client"

import type React from "react"

interface SectionHeaderProps {
  icon: React.ReactNode
  badge: string
  title: string
  description: string
  badgeColor: string
}

export default function SectionHeader({ icon, badge, title, description, badgeColor }: SectionHeaderProps) {
  return (
    <div className="text-center mb-20">
      <div
        className={`inline-flex items-center gap-4 bg-white/20 dark:bg-black/20 backdrop-blur-2xl px-10 py-5 rounded-full mb-10 border border-white/30 shadow-xl`}
      >
        {icon}
        <span className={`${badgeColor} font-bold text-xl`}>{badge}</span>
      </div>
      <h2 className="text-7xl font-bold mb-8 leading-tight">
        <span className="bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
          {title}
        </span>
      </h2>
      <p className="text-2xl text-muted-foreground max-w-5xl mx-auto leading-relaxed">{description}</p>
    </div>
  )
}
