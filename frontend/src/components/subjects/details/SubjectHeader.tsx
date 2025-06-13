// frontend/src/components/subjects/details/SubjectHeader.tsx
"use client";

import { Subject } from "@/services/subjectService";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SubjectHeaderProps {
  subject: Subject | null;
}

export default function SubjectHeader({ subject }: SubjectHeaderProps) {
  if (!subject) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-3xl md:text-4xl font-bold">
          {subject.name}
        </CardTitle>
        {subject.description && (
          <CardDescription className="text-lg mt-2">
            {subject.description}
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}