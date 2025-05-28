// frontend/src/app/dashboard/page.tsx (alebo kde máš DashboardContent)
"use client";

import ProtectedRoute from '@/components/ProtectedRoute';
import { useContext, useEffect, useState, FormEvent } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { getSubjects, createSubject, Subject, SubjectCreate, deleteSubject } from '@/services/subjectService';
import Link from 'next/link';

// Shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Pre modálne okno
import { Progress } from "@/components/ui/progress"; // Nový komponent pre progress bar

import { 
    Trash2, ExternalLink, BookCopy, AlertCircle, Loader2, 
    PlusCircle, BookOpenCheck, Zap // Nové ikony
} from "lucide-react";
import { TopicStatus } from '@/types/study'; // Potrebujeme pre výpočet pokroku

function DashboardContent() {
  const authContext = useContext(AuthContext);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stavy pre formulár na pridanie predmetu (v modálnom okne)
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authContext?.token) {
      setIsLoadingSubjects(true);
      setError(null);
      getSubjects(authContext.token)
        .then(data => {
          setSubjects(data.sort((a,b) => a.name.localeCompare(b.name))); // Zoradenie hneď pri načítaní
        })
        .catch(err => {
          console.error("Error fetching subjects:", err);
          setError((err as Error).message || 'Nepodarilo sa načítať predmety.');
        })
        .finally(() => {
          setIsLoadingSubjects(false);
        });
    }
  }, [authContext?.token]);

  const handleCreateSubject = async (e?: FormEvent) => { // e je voliteľné, ak voláme priamo
    if (e) e.preventDefault();
    if (!authContext?.token || !newSubjectName.trim()) {
      setError("Názov predmetu je povinný."); // Zobrazí sa v dialógu alebo ako globálna chyba
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const subjectData: SubjectCreate = {
      name: newSubjectName.trim(),
      description: newSubjectDescription.trim() || undefined,
    };

    try {
      const created = await createSubject(subjectData, authContext.token);
      setSubjects(prevSubjects => [created, ...prevSubjects].sort((a,b) => a.name.localeCompare(b.name)));
      setNewSubjectName('');
      setNewSubjectDescription('');
      setIsAddSubjectDialogOpen(false); // Zavri dialóg po úspechu
    } catch (err: unknown) {
      console.error("Error creating subject:", err);
      setError(err instanceof Error ? err.message : 'Nepodarilo sa vytvoriť predmet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!authContext?.token || !confirm('Naozaj chcete zmazať tento predmet a všetky jeho témy a plány? Táto akcia je nenávratná.')) {
        return;
    }
    setError(null);
    try {
        await deleteSubject(subjectId, authContext.token);
        setSubjects(prevSubjects => prevSubjects.filter(s => s.id !== subjectId));
    } catch (err: unknown) {
        console.error("Error deleting subject:", err);
        setError(err instanceof Error ? err.message : 'Nepodarilo sa zmazať predmet.');
    }
  };

  const calculateSubjectProgress = (subject: Subject): number => {
    if (!subject.topics || subject.topics.length === 0) return 0;
    const completedTopics = subject.topics.filter(t => t.status === TopicStatus.COMPLETED).length;
    return Math.round((completedTopics / subject.topics.length) * 100);
  };

  if (!authContext || !authContext.user) {
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Načítavam dáta používateľa...</p>
        </div>
    );
  }
  const { user } = authContext;

  // --- Renderovacie funkcie pre sekcie ---

  const renderHeroSection = () => (
    <Card className="mb-8 shadow-lg border-none bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
      <CardHeader>
        <CardTitle className="text-3xl md:text-4xl font-bold">
          Vitaj späť, {user.full_name?.split(' ')[0] || user.email}!
        </CardTitle>
        <CardDescription className="mt-2 text-blue-100 text-lg">
          Organizuj si štúdium, sleduj svoj pokrok a dosahuj svoje ciele efektívnejšie.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        <DialogTrigger asChild>
          <Button size="lg" className="bg-white text-primary hover:bg-gray-100 shadow-md" onClick={() => setIsAddSubjectDialogOpen(true)}>
            <PlusCircle className="mr-2 h-5 w-5" /> Pridať Nový Predmet
          </Button>
        </DialogTrigger>
        {/* TODO: Placeholder pre "Pokračovať v štúdiu"
        <Button size="lg" variant="outline" className="border-blue-200 text-white hover:bg-blue-500/20 hover:text-white">
            <BookOpenCheck className="mr-2 h-5 w-5" /> Pokračovať v štúdiu
        </Button>
        */}
      </CardContent>
    </Card>
  );

  const renderSubjectGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((subject) => {
        const progress = calculateSubjectProgress(subject);
        const uncompletedTopicsCount = subject.topics ? subject.topics.filter(t => t.status !== TopicStatus.COMPLETED).length : 0;

        return (
          <Card key={subject.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300 ease-in-out">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-semibold text-primary hover:underline">
                  <Link href={`/subjects/${subject.id}`}>
                    {subject.name}
                  </Link>
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject.id)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Zmazať predmet</span>
                </Button>
              </div>
              {subject.description && (
                <CardDescription className="text-sm line-clamp-2 mt-1">
                  {subject.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs text-muted-foreground">
                  <span>Pokrok</span>
                  <span className="font-semibold text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                <BookCopy className="mr-2 h-4 w-4 text-sky-600" />
                Celkovo tém: {subject.topics?.length || 0}
              </div>
              {uncompletedTopicsCount > 0 && (
                <div className="text-sm text-amber-600 dark:text-amber-500 flex items-center">
                  <Zap className="mr-2 h-4 w-4" />
                  Na štúdium: {uncompletedTopicsCount} tém
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Link href={`/subjects/${subject.id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Otvoriť Predmet
                </Button>
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
  
  const renderLoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
        <Card key={i} className="animate-pulse">
            <CardHeader><div className="h-6 w-3/4 bg-muted rounded"></div></CardHeader>
            <CardContent className="space-y-3">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-5/6 bg-muted rounded"></div>
                <div className="h-8 w-1/2 bg-muted rounded mt-2"></div>
            </CardContent>
            <CardFooter><div className="h-10 w-full bg-muted rounded"></div></CardFooter>
        </Card>
        ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-lg col-span-full">
      <BookOpenCheck className="w-20 h-20 mx-auto mb-6 text-gray-300 dark:text-gray-600" />
      <h2 className="text-2xl font-semibold mb-2">Začni svoju študijnú cestu!</h2>
      <p className="mb-6">Zatiaľ nemáš pridané žiadne predmety. Pridaj svoj prvý predmet a začni organizovať svoje štúdium.</p>
      <DialogTrigger asChild>
          <Button size="lg" onClick={() => setIsAddSubjectDialogOpen(true)}>
            <PlusCircle className="mr-2 h-5 w-5" /> Pridať Prvý Predmet
          </Button>
      </DialogTrigger>
    </div>
  );


  return (
    <Dialog open={isAddSubjectDialogOpen} onOpenChange={setIsAddSubjectDialogOpen}>
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {renderHeroSection()}

        {error && (
          <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Nastala Chyba</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Tvoje Predmety</h2>
            {/* TODO: Možnosť prepínať zobrazenie (grid/list) alebo filtrovať/zoraďovať */}
          </div>

          {isLoadingSubjects ? renderLoadingState() : 
           subjects.length > 0 ? renderSubjectGrid() : renderEmptyState()}
        </div>
      </div>

      {/* Modálne okno na pridanie predmetu */}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Pridať Nový Predmet</DialogTitle>
          <DialogDescription>
            Zadaj názov a voliteľný popis pre tvoj nový študijný predmet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateSubject} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="newSubjectName">Názov predmetu <span className="text-destructive">*</span></Label>
            <Input
              id="newSubjectName" value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              required placeholder="Napr. Kvantová Fyzika"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newSubjectDescription">Stručný popis</Label>
            <Textarea
              id="newSubjectDescription" value={newSubjectDescription}
              onChange={(e) => setNewSubjectDescription(e.target.value)}
              placeholder="Čo tento predmet zahŕňa? (max. 2-3 vety)"
              rows={3}
            />
          </div>
          {error && isAddSubjectDialogOpen && ( // Zobraz chybu len ak je dialóg otvorený
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => { setNewSubjectName(''); setNewSubjectDescription(''); setError(null);}}>
                Zrušiť
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !newSubjectName.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pridať predmet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}