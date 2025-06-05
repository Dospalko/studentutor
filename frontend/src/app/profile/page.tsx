// frontend/src/app/profile/page.tsx
"use client";

import { useContext, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthContext } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { 
    User as UserIcon, Edit, KeyRound, BarChartHorizontalBig, LogOut, ShieldCheck, 
    BookCopy, ChevronRight, Loader2, AlertCircle, LayoutGrid, Info // Pridané ikony
} from "lucide-react";
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Subject, getSubjects } from '@/services/subjectService';
import { TopicStatus } from '@/types/study';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function UserProfilePageContent() {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true); // Zmenené na true
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  useEffect(() => {
    if (authContext?.token && authContext?.user) {
      setIsLoadingSubjects(true);
      setSubjectsError(null);
      getSubjects(authContext.token)
        .then(data => {
          setSubjects(data.sort((a, b) => a.name.localeCompare(b.name)));
        })
        .catch(err => {
          console.error("Error fetching subjects for profile:", err);
          setSubjectsError((err as Error).message || 'Nepodarilo sa načítať predmety.');
        })
        .finally(() => {
          setIsLoadingSubjects(false);
        });
    } else if (authContext && !authContext.isLoading && !authContext.user) {
      // Ak AuthContext je načítaný, ale nie je user (napr. neplatný token),
      // nemusíme sa pokúšať načítať predmety.
      setIsLoadingSubjects(false);
    }
  }, [authContext?.token, authContext?.user, authContext?.isLoading]);

  if (authContext?.isLoading || !authContext?.user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const { user, logout } = authContext;

  const getInitials = (name?: string | null): string => {
    if (!name || name.trim() === "") return "?";
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length === 0 || !nameParts[0]) return "?";
    if (nameParts.length === 1) { return nameParts[0][0].toUpperCase(); }
    return ((nameParts[0][0] || "") + (nameParts[nameParts.length - 1][0] || "")).toUpperCase();
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  const calculateSubjectProgress = (subject: Subject): { progress: number, completedTopics: number, totalTopics: number } => {
    const totalTopics = subject.topics?.length || 0;
    if (totalTopics === 0) return { progress: 0, completedTopics: 0, totalTopics: 0 };
    
    const completedTopics = subject.topics.filter(t => t.status === TopicStatus.COMPLETED).length;
    const progress = Math.round((completedTopics / totalTopics) * 100);
    return { progress, completedTopics, totalTopics };
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-muted/30 dark:bg-muted/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-primary/50">
              <AvatarFallback className="text-2xl sm:text-3xl bg-primary/20 text-primary font-semibold">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">
                {user.full_name || "Používateľ"}
              </CardTitle>
              <CardDescription className="text-md text-muted-foreground mt-1">
                {user.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-primary" />
              Informácie o účte
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Celé meno:</span><span className="font-medium text-foreground">{user.full_name || <span className="italic text-muted-foreground/70">Nezadané</span>}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="font-medium text-foreground">{user.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ID Používateľa:</span><span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{user.id}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Status účtu:</span><Badge variant={user.is_active ? "default" : "destructive"} className={`${user.is_active ? "bg-green-500 hover:bg-green-600 text-primary-foreground" : ""} text-xs`}>{user.is_active ? "Aktívny" : "Neaktívny"}</Badge></div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <BookCopy className="h-5 w-5 mr-2 text-primary" />
              Moje Študijné Predmety
            </h3>
            {isLoadingSubjects && (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="ml-2 text-muted-foreground text-sm">Načítavam predmety...</p>
              </div>
            )}
            {!isLoadingSubjects && subjectsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Chyba pri načítaní predmetov</AlertTitle>
                <AlertDescription>{subjectsError}</AlertDescription>
              </Alert>
            )}
            {!isLoadingSubjects && !subjectsError && subjects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg p-6">
                <Info className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                <p className="font-medium mb-1">Zatiaľ nemáš žiadne predmety.</p>
                <p className="text-sm mb-4">Začni pridaním nového predmetu na svojom dashboarde.</p>
                <Link href="/dashboard" passHref legacyBehavior={false}>
                    <Button variant="secondary">
                        <LayoutGrid className="mr-2 h-4 w-4"/> Ísť na Dashboard
                    </Button>
                </Link>
              </div>
            )}
            {!isLoadingSubjects && !subjectsError && subjects.length > 0 && (
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
                          <Link href={`/subjects/${subject.id}`} passHref legacyBehavior={false}>
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

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
              Nastavenia a Akcie
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" disabled className="justify-start text-muted-foreground">
                <Edit className="h-4 w-4 mr-2" /> Upraviť Profil (čoskoro)
              </Button>
              <Button variant="outline" disabled className="justify-start text-muted-foreground">
                <KeyRound className="h-4 w-4 mr-2" /> Zmeniť Heslo (čoskoro)
              </Button>
              <Button variant="outline" disabled className="justify-start text-muted-foreground">
                <BarChartHorizontalBig className="h-4 w-4 mr-2" /> Moje Štatistiky (čoskoro)
              </Button>
              <Link href="/dashboard" passHref legacyBehavior={false}>
                <Button variant="outline" className="justify-start w-full">
                  <LayoutGrid className="h-4 w-4 mr-2" /> Dashboard
                </Button>
              </Link>
            </div>
          </div>

          <Separator />
          
          <div className="mt-6 flex justify-end">
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Odhlásiť sa
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <UserProfilePageContent />
    </ProtectedRoute>
  );
}