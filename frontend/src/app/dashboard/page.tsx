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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { 
    Trash2, ExternalLink, BookCopy, AlertCircle, Loader2, PlusCircle, 
    BookOpenCheck, TrendingUp, Target, Sparkles, GraduationCap, Clock 
} from "lucide-react";
import { TopicStatus } from '@/types/study';


import { useAchievementNotifier } from '@/hooks/useAchievementNotifier'; 

function DashboardContent() {
  const authContext = useContext(AuthContext);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---- INICIALIZÁCIA HOOKU PRE ACHIEVEMENTY ----
  const checkForNewAchievements = useAchievementNotifier();
  // -------------------------------------------

  useEffect(() => {
    if (authContext?.token) {
      setIsLoadingSubjects(true);
      setError(null);
      getSubjects(authContext.token)
        .then((data) => {
          setSubjects(data.sort((a, b) => a.name.localeCompare(b.name)));
        })
        .catch((err) => {
          console.error("Error fetching subjects:", err);
          setError((err as Error).message || "Nepodarilo sa načítať predmety.");
        })
        .finally(() => {
          setIsLoadingSubjects(false);
        });
    }
  }, [authContext?.token]);

  const handleCreateSubject = async (e?: FormEvent) => {
    if (e) e.preventDefault();
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
      setSubjects((prevSubjects) => [created, ...prevSubjects].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSubjectName("");
      setNewSubjectDescription("");
      setIsAddSubjectDialogOpen(false);
      
      // ---- SKONTROLUJ ACHIEVEMENTY PO ÚSPEŠNOM VYTVORENÍ PREDMETU ----
      await checkForNewAchievements();
      // -------------------------------------------------------------

    } catch (err: unknown) {
      console.error("Error creating subject:", err);
      setError(err instanceof Error ? err.message : "Nepodarilo sa vytvoriť predmet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (
      !authContext?.token ||
      !confirm("Naozaj chcete zmazať tento predmet a všetky jeho témy a plány? Táto akcia je nenávratná.")
    ) {
      return;
    }
    setError(null);
    try {
      await deleteSubject(subjectId, authContext.token);
      setSubjects((prevSubjects) => prevSubjects.filter((s) => s.id !== subjectId));
      // Po zmazaní predmetu by sa tiež mohli prepočítať achievementy,
      // aj keď je menej pravdepodobné, že zmazanie niečo "udelí".
      // await checkForNewAchievements(); // Voliteľné
    } catch (err: unknown) {
      console.error("Error deleting subject:", err);
      setError(err instanceof Error ? err.message : "Nepodarilo sa zmazať predmet.");
    }
  };

  const calculateSubjectProgress = (subject: Subject): number => {
    if (!subject.topics || subject.topics.length === 0) return 0;
    const completedTopics = subject.topics.filter((t) => t.status === TopicStatus.COMPLETED).length;
    return Math.round((completedTopics / subject.topics.length) * 100);
  };

  const getOverallStats = () => {
    const totalSubjects = subjects.length;
    const totalTopics = subjects.reduce((acc, subject) => acc + (subject.topics?.length || 0), 0);
    const completedTopics = subjects.reduce(
      (acc, subject) => acc + (subject.topics?.filter((t) => t.status === TopicStatus.COMPLETED).length || 0),0,);
    const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    return { totalSubjects, totalTopics, completedTopics, overallProgress };
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
  const stats = getOverallStats();

  const renderHeroSection = () => (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-primary/20 mb-8">
      <div className="absolute top-4 right-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
      <div className="absolute bottom-4 left-4 w-24 h-24 bg-secondary/5 rounded-full blur-xl"></div>
      <div className="relative p-8 md:p-12">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
          <div className="flex-1">
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary">
              <Sparkles className="mr-2 h-4 w-4" /> Dashboard
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Vitaj späť, <span className="text-primary">{user.full_name?.split(" ")[0] || user.email}!</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Organizuj si štúdium, sleduj svoj pokrok a dosahuj svoje ciele efektívnejšie s Vedom.io
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Dialog open={isAddSubjectDialogOpen} onOpenChange={setIsAddSubjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="group">
                    <PlusCircle className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
                    Pridať Nový Predmet
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader><DialogTitle className="text-xl">Pridať Nový Predmet</DialogTitle><DialogDescription>Zadaj názov a voliteľný popis pre tvoj nový študijný predmet.</DialogDescription></DialogHeader>
                  <form onSubmit={handleCreateSubject} className="space-y-4 pt-2">
                    <div className="space-y-1.5"><Label htmlFor="newSubjectName">Názov predmetu <span className="text-destructive">*</span></Label><Input id="newSubjectName" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} required placeholder="Napr. Kvantová Fyzika"/></div>
                    <div className="space-y-1.5"><Label htmlFor="newSubjectDescription">Stručný popis</Label><Textarea id="newSubjectDescription" value={newSubjectDescription} onChange={(e) => setNewSubjectDescription(e.target.value)} placeholder="Čo tento predmet zahŕňa? (max. 2-3 vety)" rows={3}/></div>
                    {error && isAddSubjectDialogOpen && <p className="text-sm text-destructive">{error}</p>}
                    <DialogFooter><DialogClose asChild><Button type="button" variant="outline" onClick={() => {setNewSubjectName(""); setNewSubjectDescription(""); setError(null);}}>Zrušiť</Button></DialogClose><Button type="submit" disabled={isSubmitting || !newSubjectName.trim()}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Pridať predmet</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:w-80">
            <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border-primary/20"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Celkový pokrok</p><p className="text-2xl font-bold text-primary">{stats.overallProgress}%</p></div><TrendingUp className="h-8 w-8 text-primary" /></div><Progress value={stats.overallProgress} className="mt-2 h-2" /></CardContent></Card>
            <Card className="bg-white/50 dark:bg-black/20 backdrop-blur-sm border-secondary/20"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Aktívne predmety</p><p className="text-2xl font-bold text-secondary">{stats.totalSubjects}</p></div><GraduationCap className="h-8 w-8 text-secondary" /></div></CardContent></Card>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubjectGrid = () => ( 
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((subject, index) => {
        const progress = calculateSubjectProgress(subject)
        const uncompletedTopicsCount = subject.topics ? subject.topics.filter((t) => t.status !== TopicStatus.COMPLETED).length : 0
        return (
          <Card key={subject.id} className="group flex flex-col hover:shadow-xl transition-all duration-300 ease-in-out hover:scale-[1.02] border-muted/40 hover:border-primary/40" style={{animationDelay: `${index * 100}ms`,}}>
            <CardHeader className="pb-4"><div className="flex justify-between items-start"><div className="flex-1"><CardTitle className="text-xl font-semibold text-primary hover:underline line-clamp-2"><Link href={`/subjects/${subject.id}`}>{subject.name}</Link></CardTitle>{subject.description && (<CardDescription className="text-sm line-clamp-2 mt-2">{subject.description}</CardDescription>)}</div><Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject.id)} className="text-muted-foreground hover:text-destructive h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /><span className="sr-only">Zmazať predmet</span></Button></div></CardHeader>
            <CardContent className="flex-grow space-y-4"><div><div className="flex justify-between items-center mb-2"><span className="text-sm text-muted-foreground">Pokrok</span><Badge variant={progress === 100 ? "default" : progress > 50 ? "secondary" : "outline"}>{progress}%</Badge></div><Progress value={progress} className="h-2" /></div><div className="grid grid-cols-2 gap-4 text-sm"><div className="flex items-center text-muted-foreground"><BookCopy className="mr-2 h-4 w-4 text-blue-500" /><span>{subject.topics?.length || 0} tém</span></div>{uncompletedTopicsCount > 0 && (<div className="flex items-center text-amber-600 dark:text-amber-500"><Clock className="mr-2 h-4 w-4" /><span>{uncompletedTopicsCount} zostáva</span></div>)}</div>{progress === 100 && (<Badge variant="default" className="w-full justify-center bg-green-500 hover:bg-green-600"><Target className="mr-2 h-4 w-4" />Dokončené!</Badge>)}</CardContent>
            <CardFooter className="pt-4"><Link href={`/subjects/${subject.id}`} className="w-full"><Button variant="outline" className="w-full group"><ExternalLink className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />Otvoriť Predmet</Button></Link></CardFooter>
          </Card>
        )
      })}
    </div>
  );
  const renderLoadingState = () => ( 
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map((i) => (<Card key={i} className="animate-pulse"><CardHeader><div className="h-6 w-3/4 bg-muted rounded"></div><div className="h-4 w-full bg-muted rounded mt-2"></div></CardHeader><CardContent className="space-y-3"><div className="h-4 w-full bg-muted rounded"></div><div className="h-4 w-5/6 bg-muted rounded"></div><div className="h-8 w-1/2 bg-muted rounded mt-2"></div></CardContent><CardFooter><div className="h-10 w-full bg-muted rounded"></div></CardFooter></Card>))}</div>
  );
  const renderEmptyState = () => (
    <div className="text-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/20"><div className="max-w-md mx-auto"><div className="mb-6 relative"><div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center"><BookOpenCheck className="w-12 h-12 text-primary" /></div><div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center"><Sparkles className="w-4 h-4 text-secondary" /></div></div><h2 className="text-2xl font-bold mb-3">Začni svoju študijnú cestu!</h2><p className="text-muted-foreground mb-8 leading-relaxed">Zatiaľ nemáš pridané žiadne predmety. Pridaj svoj prvý predmet a začni organizovať svoje štúdium s pomocou AI.</p><Dialog open={isAddSubjectDialogOpen} onOpenChange={setIsAddSubjectDialogOpen}><DialogTrigger asChild><Button size="lg" className="group"><PlusCircle className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />Pridať Prvý Predmet</Button></DialogTrigger><DialogContent className="sm:max-w-[480px]"><DialogHeader><DialogTitle className="text-xl">Pridať Nový Predmet</DialogTitle><DialogDescription>Zadaj názov a voliteľný popis pre tvoj nový študijný predmet.</DialogDescription></DialogHeader><form onSubmit={handleCreateSubject} className="space-y-4 pt-2"><div className="space-y-1.5"><Label htmlFor="newSubjectNameDialog">Názov predmetu <span className="text-destructive">*</span></Label><Input id="newSubjectNameDialog" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} required placeholder="Napr. Kvantová Fyzika"/></div><div className="space-y-1.5"><Label htmlFor="newSubjectDescriptionDialog">Stručný popis</Label><Textarea id="newSubjectDescriptionDialog" value={newSubjectDescription} onChange={(e) => setNewSubjectDescription(e.target.value)} placeholder="Čo tento predmet zahŕňa? (max. 2-3 vety)" rows={3}/></div>{error && isAddSubjectDialogOpen && <p className="text-sm text-destructive">{error}</p>}<DialogFooter><DialogClose asChild><Button type="button" variant="outline" onClick={() => {setNewSubjectName(""); setNewSubjectDescription(""); setError(null);}}>Zrušiť</Button></DialogClose><Button type="submit" disabled={isSubmitting || !newSubjectName.trim()}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Pridať predmet</Button></DialogFooter></form></DialogContent></Dialog></div></div>
  );

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-7xl">
      {renderHeroSection()}

      {error && !isAddSubjectDialogOpen && ( // Zobraz globálnu chybu len ak nie je otvorený dialóg na pridanie predmetu
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nastala Chyba</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Tvoje Predmety</h2>
            <p className="text-muted-foreground mt-1">
              {subjects.length > 0
                ? `Spravuj ${subjects.length} predmet${subjects.length !== 1 ? "y" : ""}`
                : "Začni pridaním svojho prvého predmetu"}
            </p>
          </div>
          {subjects.length > 0 && (
            <Badge variant="outline" className="text-sm">
              {stats.completedTopics} z {stats.totalTopics} tém dokončených
            </Badge>
          )}
        </div>

        {isLoadingSubjects ? renderLoadingState() : subjects.length > 0 ? renderSubjectGrid() : renderEmptyState()}
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