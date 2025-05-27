// frontend/src/components/subjects/SubjectHeader.tsx
"use client";

import { Subject } from "@/services/subjectService";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubjectHeaderProps {
  subject: Subject | null;
  // onEditSubject?: () => void; // Pre budúcu editáciu predmetu
}

export default function SubjectHeader({ subject }: SubjectHeaderProps) {
  const router = useRouter();

  if (!subject) {
    // Môžeš zobraziť nejaký placeholder alebo nič, ak sa načíta inde
    return null; 
  }

  return (
    <>
      <div className="mb-8 flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Späť na Dashboard
        </Button>
        {/* TODO: Tlačidlo na editáciu predmetu
        <Button variant="outline" onClick={onEditSubject}>
            Upraviť Predmet
        </Button>
        */}
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold">{subject.name}</CardTitle>
          {subject.description && <CardDescription className="text-lg mt-2">{subject.description}</CardDescription>}
        </CardHeader>
      </Card>
    </>
  );
}