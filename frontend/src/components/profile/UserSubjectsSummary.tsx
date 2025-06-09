// frontend/src/components/profile/UserSubjectsSummary.tsx
"use client";

import Link from 'next/link';
import { Subject } from '@/services/subjectService';
import { TopicStatus } from '@/types/study';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookCopy, ChevronRight, Loader2, Info, LayoutGrid, AlertCircle } from "lucide-react";

interface UserSubjectsSummaryProps {
  subjects: Subject[];
  isLoading: boolean;
  error: string | null;
}

const calculateSubjectProgress = (subject: Subject): { progress: number, completedTopics: number, totalTopics: number } => {
    const totalTopics = subject.topics?.length || 0;
    if (totalTopics === 0) return { progress: 0, completedTopics: 0, totalTopics: 0 };
    
    const completedTopics = subject.topics.filter(t => t.status === TopicStatus.COMPLETED).length;
    const progress = Math.round((completedTopics / totalTopics) * 100);
    return { progress, completedTopics, totalTopics };
  };

export default function UserSubjectsSummary({ subjects, isLoading, error }: UserSubjectsSummaryProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <BookCopy className="h-5 w-5 mr-2 text-primary" />
        Moje Študijné Predmety
      </h3>
      {isLoading && (
        <div className="flex justify-center items-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground text-sm">Načítavam predmety...</p>
        </div>
      )}
      {!isLoading && error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chyba pri načítaní predmetov</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!isLoading && !error && subjects.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg p-6">
          <Info className="w-12 h-12 mx-auto mb-4 text-primary/50" />
          <p className="font-medium mb-1">Zatiaľ nemáš žiadne predmety.</p>
          <p className="text-sm mb-4">Začni pridaním nového predmetu na svojom dashboarde.</p>
          <Link href="/dashboard" passHref>
              <Button variant="secondary">
                  <LayoutGrid className="mr-2 h-4 w-4"/> Ísť na Dashboard
              </Button>
          </Link>
        </div>
      )}
      {!isLoading && !error && subjects.length > 0 && (
        <div className="space-y-4">
          {subjects.map(subject => {
            const { progress, completedTopics, totalTopics } = calculateSubjectProgress(subject);
            return (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <Link href={`/subjects/${subject.id}`} className="group">
                      <CardTitle className="text-md font-semibold group-hover:text-primary group-hover:underline">
                        {subject.name}
                      </CardTitle>
                    </Link>
                    <Link href={`/subjects/${subject.id}`} passHref>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          Detail <ChevronRight className="ml-1 h-3 w-3"/>
                      </Button>
                    </Link>
                  </div>
                  {subject.description && (
                    <CardDescription className="text-xs line-clamp-2 mt-1">
                      {subject.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    Pokrok: {completedTopics} / {totalTopics} tém
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="text-right text-xs font-medium text-primary mt-1">{progress}%</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}