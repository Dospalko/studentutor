"use client"

import type React from "react"

interface ContentSectionProps {
  id: string
  children: React.ReactNode
  className?: string
}

export default function ContentSection({ id, children, className = "" }: ContentSectionProps) {
  return (
    <section id={id} className={`min-h-screen flex items-center justify-center py-20 relative ${className}`}>
      <div className="w-full max-w-7xl mx-auto px-8 relative z-10">{children}</div>
    </section>
  )
}
