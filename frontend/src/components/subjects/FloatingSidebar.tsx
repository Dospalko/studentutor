"use client"

import { BarChart3, Target, Calendar, FileText } from "lucide-react"
import { useState, useEffect } from "react"

interface SidebarItem {
  id: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  label: string
  color: string
}

const sidebarItems: SidebarItem[] = [
  { id: "overview", icon: BarChart3, label: "Prehľad", color: "text-blue-600" },
  { id: "topics", icon: Target, label: "Témy", color: "text-green-600" },
  { id: "plan", icon: Calendar, label: "Plán", color: "text-purple-600" },
  { id: "materials", icon: FileText, label: "Materiály", color: "text-amber-600" },
]

interface FloatingSidebarProps {
  className?: string
}

export default function FloatingSidebar({ className = "" }: FloatingSidebarProps) {
  const [activeSection, setActiveSection] = useState("overview")

  useEffect(() => {
    const handleScroll = () => {
      const sections = sidebarItems.map((item) => item.id)
      const scrollPosition = window.scrollY + window.innerHeight / 2

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <div className={`fixed top-1/2 right-6 transform -translate-y-1/2 z-50 hidden lg:block ${className}`}>
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-border/50">
        <div className="flex flex-col gap-4">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <button
                key={item.id}
                className={`group relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                    : "bg-background hover:bg-primary/10 border-border/50 hover:border-primary/30"
                }`}
                title={item.label}
                onClick={() => scrollToSection(item.id)}
              >
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    isActive ? "text-primary-foreground" : `${item.color} group-hover:text-primary`
                  }`}
                />

                {/* Tooltip */}
                <div className="absolute right-full mr-4 px-3 py-2 bg-foreground text-background text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg">
                  {item.label}
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-foreground border-y-4 border-y-transparent"></div>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>

    
      </div>
    </div>
  )
}
