"use client";

import { useContext, useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthContext } from '@/context/AuthContext';
import { getSubjectById, Subject } from '@/services/subjectService'; // Subject typ by mal mať topics: Topic[]
import {
  Topic,
  TopicCreate,
  TopicUpdate, // Použijeme TopicUpdate pre čiastočné aktualizácie
  createTopicForSubject,
  updateTopic,
  deleteTopic
} from '@/services/topicService';

// Shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose // Pre explicitné zatvorenie
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ArrowLeft, PlusCircle, Edit3, Trash2, AlertCircle, Loader2, FileText } from "lucide-react";
import { TopicStatus, UserDifficulty } from '@/types/study';

// Pomocná funkcia na formátovanie enum hodnôt
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const NONE_VALUE_PLACEHOLDER = "_none_"; // Špeciálna hodnota pre "Žiadna"

function SubjectDetailPageContent() {
  const authContext = useContext(AuthContext);
  const params = useParams();
  const router = useRouter();
  const subjectIdParam = params.subjectId as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicName, setTopicName] = useState('');
  const [topicUserStrengths, setTopicUserStrengths] = useState('');
  const [topicUserWeaknesses, setTopicUserWeaknesses] = useState('');
  const [topicUserDifficulty, setTopicUserDifficulty] = useState<UserDifficulty | typeof NONE_VALUE_PLACEHOLDER>(NONE_VALUE_PLACEHOLDER);
  const [topicStatus, setTopicStatus] = useState<TopicStatus>(TopicStatus.NOT_STARTED);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

  useEffect(() => {
    if (authContext?.token && subjectIdParam) {
      const subjectId = parseInt(subjectIdParam);
      if (isNaN(subjectId)) {
        setError("Neplatné ID predmetu.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      getSubjectById(subjectId, authContext.token)
        .then(data => {
          setSubject(data);
          setTopics(data.topics || []);
        })
        .catch(err => {
          console.error("Error fetching subject details:", err);
          setError((err as Error).message || 'Nepodarilo sa načítať detail predmetu.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!subjectIdParam) {
        setError("Chýba ID predmetu.");
        setIsLoading(false);
    }
  }, [authContext?.token, subjectIdParam]);

  const resetTopicForm = () => {
    setTopicName('');
    setTopicUserStrengths('');
    setTopicUserWeaknesses('');
    setTopicUserDifficulty(NONE_VALUE_PLACEHOLDER);
    setTopicStatus(TopicStatus.NOT_STARTED);
    setEditingTopic(null);
    setError(null); // Aj chyby formulára
  }

  const openNewTopicDialog = () => {
    resetTopicForm();
    setIsTopicDialogOpen(true);
  };

  const openEditTopicDialog = (topic: Topic) => {
    resetTopicForm(); // Najprv resetuj
    setEditingTopic(topic);
    setTopicName(topic.name);
    setTopicUserStrengths(topic.user_strengths || '');
    setTopicUserWeaknesses(topic.user_weaknesses || '');
    setTopicUserDifficulty(topic.user_difficulty || NONE_VALUE_PLACEHOLDER);
    setTopicStatus(topic.status);
    setIsTopicDialogOpen(true);
  };

  const handleTopicFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authContext?.token || !subjectIdParam || !topicName.trim()) {
      setError("Názov témy je povinný.");
      return;
    }
    const subjectId = parseInt(subjectIdParam);
    setIsSubmittingTopic(true);
    setError(null);

    const difficultyToSend = topicUserDifficulty === NONE_VALUE_PLACEHOLDER ? undefined : topicUserDifficulty;

    const commonTopicData = {
        name: topicName.trim(),
        user_strengths: topicUserStrengths.trim() || undefined, // Pošli undefined ak je prázdne, backend to môže interpretovať ako null
        user_weaknesses: topicUserWeaknesses.trim() || undefined,
        user_difficulty: difficultyToSend,
        status: topicStatus,
    };
    
    try {
        if (editingTopic) {
            // Pre update posielame len zmenené polia, TopicUpdate typ
            const topicDataForUpdate: TopicUpdate = { ...commonTopicData };
            // Ak chceš explicitne poslať null na vymazanie polí, ktoré sú optional strings:
            if (!topicUserStrengths.trim()) topicDataForUpdate.user_strengths = null;
            if (!topicUserWeaknesses.trim()) topicDataForUpdate.user_weaknesses = null;
            if (topicUserDifficulty === NONE_VALUE_PLACEHOLDER) topicDataForUpdate.user_difficulty = null;


            const updated = await updateTopic(editingTopic.id, topicDataForUpdate, authContext.token);
            setTopics(prevTopics => prevTopics.map(t => t.id === updated.id ? updated : t).sort((a, b) => a.name.localeCompare(b.name)));
        } else {
            // Pre create posielame TopicCreate typ
            const topicDataForCreate: TopicCreate = { ...commonTopicData };
            if (!topicDataForCreate.status) { // Zaisti, že status má hodnotu
                topicDataForCreate.status = TopicStatus.NOT_STARTED;
            }

            const created = await createTopicForSubject(subjectId, topicDataForCreate, authContext.token);
            setTopics(prevTopics => [created, ...prevTopics].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setIsTopicDialogOpen(false);
        resetTopicForm(); // Resetuj formulár po úspešnom odoslaní
    } catch (err: unknown) {
        console.error("Error submitting topic:", err);
        setError(err instanceof Error ? err.message : (editingTopic ? 'Nepodarilo sa aktualizovať tému.' : 'Nepodarilo sa vytvoriť tému.'));
    } finally {
        setIsSubmittingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!authContext?.token) return;
    // Použi shadcn Dialog pre confirmáciu namiesto window.confirm pre lepšie UX
    // Toto je zjednodušené s window.confirm pre teraz
    if (!window.confirm('Naozaj chcete zmazať túto tému?')) {
        return;
    }
    setError(null);
    try {
        await deleteTopic(topicId, authContext.token);
        setTopics(prevTopics => prevTopics.filter(t => t.id !== topicId));
    } catch (err: unknown) {
        console.error("Error deleting topic:", err);
        setError(err instanceof Error ? err.message : "Nepodarilo sa zmazať tému.");
    }
  };

  if (!authContext?.token || (!authContext?.user && isLoading)) { // Pridaná kontrola tokenu pre počiatočný render
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)] p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Načítavam...</p>
        </div>
    );
  }

  if (isLoading) {
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)] p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Načítavam detail predmetu...</p>
        </div>
    );
  }

  if (error && !subject) {
    return (
      <div className="container mx-auto p-4 text-center mt-10">
        <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Chyba</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/dashboard')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Späť na Dashboard
        </Button>
      </div>
    );
  }

  if (!subject) {
    return (
        <div className="container mx-auto p-4 text-center mt-10">
            <Alert className="max-w-md mx-auto">
                <FileText className="h-4 w-4" />
                <AlertTitle>Predmet nenájdený</AlertTitle>
                <AlertDescription>Zdá sa, že tento predmet neexistuje alebo k nemu nemáte prístup.</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/dashboard')} className="mt-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> Späť na Dashboard
            </Button>
        </div>
    );
  }

  const sortedTopics = [...topics].sort((a,b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Späť na Dashboard
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Nastala Chyba</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold">{subject.name}</CardTitle>
          {subject.description && <CardDescription className="text-lg mt-2">{subject.description}</CardDescription>}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Témy predmetu</CardTitle>
          <Button onClick={openNewTopicDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Pridať tému
          </Button>
        </CardHeader>
        <CardContent>
          {sortedTopics.length > 0 ? (
            <div className="space-y-4">
              {sortedTopics.map(topic => (
                <Card key={topic.id} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-start justify-between bg-muted/30 p-4">
                    <div className="flex-grow pr-2">
                        <CardTitle className="text-lg">{topic.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openEditTopicDialog(topic)}>
                            <Edit3 className="h-4 w-4" />
                            <span className="sr-only">Upraviť tému</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/10 hover:bg-destructive/10" onClick={() => handleDeleteTopic(topic.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Zmazať tému</span>
                        </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 text-sm">
                    <div>
                        <Badge 
                            variant={
                                topic.status === TopicStatus.COMPLETED ? "default" :
                                topic.status === TopicStatus.IN_PROGRESS ? "secondary" :
                                "outline"
                            } 
                            className={
                                topic.status === TopicStatus.COMPLETED ? 'bg-green-500 hover:bg-green-600 text-white' : 
                                topic.status === TopicStatus.IN_PROGRESS ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                                topic.status === TopicStatus.NEEDS_REVIEW ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                                ''
                            }
                        >
                            Status: {formatEnumValue(topic.status)}
                        </Badge>
                    </div>
                    {topic.user_difficulty && (
                        <p className="text-muted-foreground">Vnímaná náročnosť: <span className="font-semibold text-foreground">{formatEnumValue(topic.user_difficulty)}</span></p>
                    )}
                    {topic.user_strengths && (
                        <p className="text-green-700 dark:text-green-500"><span className="font-semibold">Silné stránky:</span> {topic.user_strengths}</p>
                    )}
                    {topic.user_weaknesses && (
                        <p className="text-red-700 dark:text-red-500"><span className="font-semibold">Slabé stránky:</span> {topic.user_weaknesses}</p>
                    )}
                    {!topic.user_difficulty && !topic.user_strengths && !topic.user_weaknesses && (
                        <p className="text-xs text-muted-foreground italic">Pre túto tému neboli zadané žiadne ďalšie detaily.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">Tento predmet zatiaľ nemá žiadne témy.</p>
              <Button variant="secondary" onClick={openNewTopicDialog} className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Pridať prvú tému
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isTopicDialogOpen} onOpenChange={(open) => {
          setIsTopicDialogOpen(open);
          if (!open) resetTopicForm(); // Resetuj formulár pri zatvorení dialógu
      }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingTopic ? 'Upraviť tému' : 'Pridať novú tému'}</DialogTitle>
            {subject && (
                <DialogDescription>
                {editingTopic ? `Upravujete tému "${editingTopic.name}".` : `Pridávate novú tému k predmetu "${subject.name}".`}
                </DialogDescription>
            )}
          </DialogHeader>
          <form onSubmit={handleTopicFormSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="topicName">Názov témy <span className="text-destructive">*</span></Label>
              <Input id="topicName" value={topicName} onChange={(e) => setTopicName(e.target.value)} required placeholder="Napr. Limity a spojitosť funkcií" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="topicStatus">Status</Label>
                    <Select value={topicStatus} onValueChange={(value) => setTopicStatus(value as TopicStatus)}>
                        <SelectTrigger id="topicStatus">
                            <SelectValue placeholder="Vyberte status" />
                        </SelectTrigger>
                        <SelectContent>
                        {Object.values(TopicStatus).map(status => (
                            <SelectItem key={status} value={status}>{formatEnumValue(status)}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="topicUserDifficulty">Vnímaná náročnosť</Label>
                    <Select
                        value={topicUserDifficulty}
                        onValueChange={(value) => setTopicUserDifficulty(value as UserDifficulty | typeof NONE_VALUE_PLACEHOLDER)}
                    >
                        <SelectTrigger id="topicUserDifficulty">
                            <SelectValue placeholder="Vyberte náročnosť" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE_VALUE_PLACEHOLDER}>Žiadna</SelectItem>
                            {Object.values(UserDifficulty).map(diff => (
                                <SelectItem key={diff} value={diff}>{formatEnumValue(diff)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="topicUserStrengths">Silné stránky (poznámky)</Label>
              <Textarea id="topicUserStrengths" value={topicUserStrengths} onChange={(e) => setTopicUserStrengths(e.target.value)} placeholder="Čo ti v tejto téme ide dobre?" rows={2}/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topicUserWeaknesses">Slabé stránky (poznámky)</Label>
              <Textarea id="topicUserWeaknesses" value={topicUserWeaknesses} onChange={(e) => setTopicUserWeaknesses(e.target.value)} placeholder="S čím máš v tejto téme problémy?" rows={2}/>
            </div>
            <DialogFooter className="pt-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isSubmittingTopic}>Zrušiť</Button>
                </DialogClose>
              <Button type="submit" disabled={isSubmittingTopic || !topicName.trim()}>
                {isSubmittingTopic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTopic ? 'Uložiť zmeny' : 'Vytvoriť tému'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SubjectDetailPage() {
  return (
    <ProtectedRoute>
      <SubjectDetailPageContent />
    </ProtectedRoute>
  );
}