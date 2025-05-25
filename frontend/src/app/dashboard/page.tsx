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
import { Trash2, FolderPlus, ExternalLink, Info, BookCopy, AlertCircle } from "lucide-react"; // Ikony z lucide-react

function DashboardContent() {
  const authContext = useContext(AuthContext);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authContext?.token) {
      setIsLoadingSubjects(true);
      setError(null);
      getSubjects(authContext.token)
        .then(data => {
          setSubjects(data);
        })
        .catch(err => {
          console.error("Error fetching subjects:", err);
          setError(err.message || 'Nepodarilo sa načítať predmety.');
        })
        .finally(() => {
          setIsLoadingSubjects(false);
        });
    }
  }, [authContext?.token]);

  const handleCreateSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!authContext?.token || !newSubjectName.trim()) {
      setError("Názov predmetu je povinný.");
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
      setSubjects(prevSubjects => [created, ...prevSubjects].sort((a,b) => a.name.localeCompare(b.name))); // Zoradenie
      setNewSubjectName('');
      setNewSubjectDescription('');
    } catch (err: Error | unknown) {
      console.error("Error creating subject:", err);
      setError(err instanceof Error ? err.message : 'Nepodarilo sa vytvoriť predmet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!authContext?.token || !confirm('Naozaj chcete zmazať tento predmet a všetky jeho témy? Táto akcia je nenávratná.')) {
        return;
    }
    setError(null);
    try {
        await deleteSubject(subjectId, authContext.token);
        setSubjects(prevSubjects => prevSubjects.filter(s => s.id !== subjectId));
    } catch (err: Error | unknown) {
        console.error("Error deleting subject:", err);
        setError(err instanceof Error ? err.message : 'Nepodarilo sa zmazať predmet.');
    }
  };

  if (!authContext || !authContext.user) {
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)] p-4">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
            <p className="mt-4 text-muted-foreground">Načítavam dáta používateľa...</p>
        </div>
    );
  }
  const { user } = authContext;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Card className="mb-8 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-primary-foreground shadow-xl border-none">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Vitaj späť, {user.full_name?.split(' ')[0] || user.email}!
          </CardTitle>
          <CardDescription className="mt-2 text-blue-100 text-lg">
            Pripravený napredovať vo svojom štúdiu? Spravuj svoje predmety a sleduj svoj pokrok.
          </CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nastala Chyba</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="sticky top-24"> {/* sticky pre formulár na boku */}
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <FolderPlus className="mr-2 h-5 w-5 text-primary" />
                Pridať Nový Predmet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSubject} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="subjectName">Názov predmetu <span className="text-destructive">*</span></Label>
                  <Input
                    type="text"
                    id="subjectName"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    required
                    placeholder="Napr. Dejiny Umenia"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subjectDescription">Stručný popis</Label>
                  <Textarea
                    id="subjectDescription"
                    value={newSubjectDescription}
                    onChange={(e) => setNewSubjectDescription(e.target.value)}
                    placeholder="Čo tento predmet zahŕňa?"
                    rows={4}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting || !newSubjectName.trim()} className="w-full">
                  {isSubmitting ? 'Pridávam...' : 'Pridať predmet'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <BookCopy className="mr-2 h-5 w-5 text-primary" />
                Tvoje Študijné Predmety
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSubjects ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-28 bg-muted rounded-lg animate-pulse p-4 space-y-2">
                        <div className="h-5 w-3/4 bg-muted-foreground/20 rounded"></div>
                        <div className="h-3 w-1/2 bg-muted-foreground/20 rounded"></div>
                        <div className="h-3 w-1/4 bg-muted-foreground/20 rounded mt-2"></div>
                    </div>
                  ))}
                </div>
              ) : subjects.length > 0 ? (
                <ul className="space-y-4">
                  {subjects.map((subject) => (
                    <li key={subject.id}>
                      <Card className="hover:shadow-lg transition-shadow duration-200">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                            <div className="flex-grow pr-4">
                                <CardTitle className="text-lg font-semibold">
                                    <Link href={`/subjects/${subject.id}`} className="hover:underline text-primary decoration-primary/50 hover:decoration-primary">
                                        {subject.name}
                                    </Link>
                                </CardTitle>
                                {subject.description && (
                                    <CardDescription className="text-sm line-clamp-2 mt-1">
                                        {subject.description}
                                    </CardDescription>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject.id)} className="text-destructive hover:bg-destructive/10 flex-shrink-0">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Zmazať predmet</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                            <div className="flex items-center text-xs text-muted-foreground">
                                <Info className="mr-1.5 h-3.5 w-3.5" />
                                Počet tém: <span className="font-semibold text-foreground ml-1">{subject.topics?.length || 0}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Link href={`/subjects/${subject.id}`} className="w-full">
                                <Button variant="outline" className="w-full text-sm">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Zobraziť Detail a Témy
                                </Button>
                            </Link>
                        </CardFooter>
                      </Card>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  <BookCopy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-1">Zatiaľ žiadne predmety.</p>
                  <p className="text-sm">Začni pridaním nového predmetu pomocou formulára.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}