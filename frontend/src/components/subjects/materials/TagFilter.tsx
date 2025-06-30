/* -------------------------------- TagFilter.tsx -------------------------- */
"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"

interface Props {
  tags: string[]          // všetky rôzne tagy, ktoré existujú v materiáloch
  onChange?: (active: string[]) => void
}

export default function TagFilter({ tags, onChange }: Props) {
  const [active, setActive] = useState<string[]>([])

  const toggle = (t: string) => {
    const next = active.includes(t)
      ? active.filter((x) => x !== t)
      : [...active, t]

    setActive(next)
    onChange?.(next)        // pošleme rodičovi
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => {
        const isOn = active.includes(t)
        return (
          <Badge
            key={t}
            onClick={() => toggle(t)}
            className={`cursor-pointer select-none ${
              isOn
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/70 text-muted-foreground"
            }`}
          >
            #{t}
          </Badge>
        )
      })}
    </div>
  )
}
