"use client"

import type { Subject } from "@/services/subjectService"
import { SubjectCard } from "./SubjectCard"

interface SubjectGridProps {
  subjects: Subject[]
  onDeleteSubject: (subjectId: number) => void
}

export function SubjectGrid({ subjects, onDeleteSubject }: SubjectGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {subjects.map((subject, index) => (
        <SubjectCard key={subject.id} subject={subject} onDelete={onDeleteSubject} index={index} />
      ))}
    </div>
  )
}
