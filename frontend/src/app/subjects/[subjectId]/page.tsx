"use client";

import { useContext, useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthContext } from '@/context/AuthContext';
import { getSubjectById, Subject } from '@/services/subjectService';
import {
  Topic,
  TopicCreate,
  TopicUpdate,
  createTopicForSubject,
  updateTopic,
  deleteTopic
} from '@/services/topicService';
import {
  StudyPlan,
  StudyBlock,
  StudyPlanCreate,
  StudyBlockUpdate,
  generateOrGetStudyPlan,
  getActiveStudyPlanForSubject,
  updateStudyBlock
} from '@/services/studyPlanService';
import { TopicStatus, UserDifficulty, StudyBlockStatus, StudyPlanStatus } from '@/types/study';

// Shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  ArrowLeft, PlusCircle, Edit3, Trash2, AlertCircle, Loader2, FileText,
  CalendarDays, CheckCircle2, XCircle, Zap, Hourglass, ListChecks, BrainCog
} from "lucide-react";

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

  // Stavy pre Predmet a Témy
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Hlavné načítavanie
  const [error, setError] = useState<string | null>(null); // Chyby pre predmet/témy

  // Stavy pre dialóg a formulár tém
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicName, setTopicName] = useState('');
  const [topicUserStrengths, setTopicUserStrengths] = useState('');
  const [topicUserWeaknesses, setTopicUserWeaknesses] = useState('');
  const [topicUserDifficulty, setTopicUserDifficulty] = useState<UserDifficulty | string>(NONE_VALUE_PLACEHOLDER);
  const [topicStatus, setTopicStatus] = useState<TopicStatus>(TopicStatus.NOT_STARTED);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

  // Stavy pre Študijný Plán
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Načítanie predmetu, tém a následne plánu
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
      setPlanError(null);
      setStudyPlan(null);

      getSubjectById(subjectId, authContext.token)
        .then(data => {
          setSubject(data);
          setTopics(data.topics || []);
          // Po úspešnom načítaní predmetu, načítaj jeho aktívny študijný plán
          if (authContext.token) { // Token by tu mal byť vždy, ale pre istotu
            setIsLoadingPlan(true);
            getActiveStudyPlanForSubject(subjectId, authContext.token)
              .then(planData => {
                setStudyPlan(planData);
              })
              .catch(err => {
                console.error("Error fetching study plan:", err);
                setPlanError((err as Error).message || 'Nepodarilo sa načítať študijný plán.');
              })
              .finally(() => {
                setIsLoadingPlan(false);
              });
          }
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

  // --- Logika pre Témy ---
  const resetTopicForm = () => {
    setTopicName('');
    setTopicUserStrengths('');
    setTopicUserWeaknesses('');
    setTopicUserDifficulty(NONE_VALUE_PLACEHOLDER);
    setTopicStatus(TopicStatus.NOT_STARTED);
    setEditingTopic(null);
    // Nezmazávame hlavný error, len error špecifický pre formulár (ak by sme ho mali)
  }

  const openNewTopicDialog = () => {
    resetTopicForm();
    setIsTopicDialogOpen(true);
  };

  const openEditTopicDialog = (topic: Topic) => {
    resetTopicForm();
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
      setError("Názov témy je povinný."); // Zobrazí sa v hlavnom error Alerte
      return;
    }
    const subjectId = parseInt(subjectIdParam);
    setIsSubmittingTopic(true);
    setError(null); // Vyčisti hlavný error pred submitom

    const difficultyToSend = topicUserDifficulty === NONE_VALUE_PLACEHOLDER ? undefined : topicUserDifficulty as UserDifficulty;
    const commonTopicData = {
        name: topicName.trim(),
        user_strengths: topicUserStrengths.trim() || undefined,
        user_weaknesses: topicUserWeaknesses.trim() || undefined,
        user_difficulty: difficultyToSend,
        status: topicStatus,
    };
    
    try {
        if (editingTopic) {
            const topicDataForUpdate: TopicUpdate = { ...commonTopicData };
            if (!topicUserStrengths.trim()) topicDataForUpdate.user_strengths = null;
            if (!topicUserWeaknesses.trim()) topicDataForUpdate.user_weaknesses = null;
            if (topicUserDifficulty === NONE_VALUE_PLACEHOLDER) topicDataForUpdate.user_difficulty = null;

            const updated = await updateTopic(editingTopic.id, topicDataForUpdate, authContext.token);
            setTopics(prevTopics => prevTopics.map(t => t.id === updated.id ? updated : t).sort((a, b) => a.name.localeCompare(b.name)));
        } else {
            const topicDataForCreate: TopicCreate = { ...commonTopicData };
            if (!topicDataForCreate.status) {
                topicDataForCreate.status = TopicStatus.NOT_STARTED;
            }
            const created = await createTopicForSubject(subjectId, topicDataForCreate, authContext.token);
            setTopics(prevTopics => [created, ...prevTopics].sort((a, b) => a.name.localeCompare(b.name)));
        }
        setIsTopicDialogOpen(false);
        resetTopicForm();
    } catch (err: unknown) {
        console.error("Error submitting topic:", err);
        setError(err instanceof Error ? err.message : (editingTopic ? 'Nepodarilo sa aktualizovať tému.' : 'Nepodarilo sa vytvoriť tému.'));
    } finally {
        setIsSubmittingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!authContext?.token) return;
    if (!window.confirm('Naozaj chcete zmazať túto tému?')) return;
    
    setError(null);
    try {
        await deleteTopic(topicId, authContext.token);
        setTopics(prevTopics => prevTopics.filter(t => t.id !== topicId));
    } catch (err: unknown) {
        console.error("Error deleting topic:", err);
        setError(err instanceof Error ? err.message : "Nepodarilo sa zmazať tému.");
    }
  };

  // --- Logika pre Študijný Plán ---
  const handleGeneratePlan = async () => {
    if (!authContext?.token || !subject) return;

    setIsLoadingPlan(true);
    setPlanError(null);
    const planData: StudyPlanCreate = { subject_id: subject.id };

    try {
      const newPlan = await generateOrGetStudyPlan(planData, authContext.token);
      setStudyPlan(newPlan);
    } catch (err) {
      console.error("Error generating study plan:", err);
      setPlanError((err as Error).message || 'Nepodarilo sa vygenerovať študijný plán.');
    } finally {
      setIsLoadingPlan(false);
    }
  };

  const handleUpdateBlockStatus = async (blockId: number, newStatus: StudyBlockStatus) => {
    if (!authContext?.token || !studyPlan) return;

    const originalBlocks = studyPlan.study_blocks;
    const updatedBlocks = originalBlocks.map(block =>
      block.id === blockId ? { ...block, status: newStatus } : block
    );
    setStudyPlan({ ...studyPlan, study_blocks: updatedBlocks });

    const blockData: StudyBlockUpdate = { status: newStatus };
    try {
      const updatedBlockResponse = await updateStudyBlock(blockId, blockData, authContext.token);
      
      setStudyPlan(prevPlan => {
        if (!prevPlan) return null;
        const newBlocks = prevPlan.study_blocks.map(b =>
            b.id === updatedBlockResponse.id 
            ? { ...updatedBlockResponse, topic: originalBlocks.find(ob => ob.topic_id === updatedBlockResponse.topic_id)?.topic || b.topic } // zachovaj pôvodný topic info alebo aktualizuj ak máš
            : b
        );
        return { ...prevPlan, study_blocks: newBlocks };
      });
      
      if (newStatus === StudyBlockStatus.COMPLETED) {
        const affectedTopicId = originalBlocks.find(b => b.id === blockId)?.topic_id;
        if (affectedTopicId) {
            setTopics(prevTopics => prevTopics.map(t =>
                t.id === affectedTopicId ? { ...t, status: TopicStatus.COMPLETED } : t
            ));
        }
      }

    } catch (err) {
      console.error("Error updating study block:", err);
      setPlanError((err as Error).message || 'Nepodarilo sa aktualizovať študijný blok.');
      setStudyPlan({ ...studyPlan, study_blocks: originalBlocks }); // Vráť optimistický update
    }
  };

  // --- Stavy pre UI ---
  if (!authContext?.token || (!authContext?.user && isLoading)) {
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)] p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Načítavam...</p>
        </div>
    );
  }

  if (isLoading) { // Hlavné načítavanie predmetu
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-8rem)] p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Načítavam detail predmetu...</p>
        </div>
    );
  }

  if (error && !subject) { // Chyba pri načítaní predmetu
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

  if (!subject) { // Predmet nenájdený
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
  const sortedStudyBlocks = studyPlan ? [...studyPlan.study_blocks].sort((a,b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime() ) : [];


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigácia a Hlavný Error Alert */}
      <div className="mb-8 flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Späť na Dashboard
        </Button>
      </div>
      {error && ( // Chyba pre operácie s témami
        <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Chyba Operácie s Témou</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Karta Predmetu */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold">{subject.name}</CardTitle>
          {subject.description && <CardDescription className="text-lg mt-2">{subject.description}</CardDescription>}
        </CardHeader>
      </Card>

      {/* Karta Tém Predmetu */}
      <Card className="mb-8">
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
                        <Button variant="ghost" size="icon" onClick={() => openEditTopicDialog(topic)} aria-label={`Upraviť tému ${topic.name}`}>
                            <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/10 hover:bg-destructive/10" onClick={() => handleDeleteTopic(topic.id)} aria-label={`Zmazať tému ${topic.name}`}>
                            <Trash2 className="h-4 w-4" />
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
                    {topic.user_difficulty && topic.user_difficulty !== NONE_VALUE_PLACEHOLDER && (
                        <p className="text-muted-foreground">Vnímaná náročnosť: <span className="font-semibold text-foreground">{formatEnumValue(topic.user_difficulty)}</span></p>
                    )}
                    {topic.user_strengths && (
                        <p className="text-green-700 dark:text-green-500"><span className="font-semibold">Silné stránky:</span> {topic.user_strengths}</p>
                    )}
                    {topic.user_weaknesses && (
                        <p className="text-red-700 dark:text-red-500"><span className="font-semibold">Slabé stránky:</span> {topic.user_weaknesses}</p>
                    )}
                    {(!topic.user_difficulty || topic.user_difficulty === NONE_VALUE_PLACEHOLDER as any) && !topic.user_strengths && !topic.user_weaknesses && (
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

      {/* Dialóg na pridanie/editáciu témy */}
      <Dialog open={isTopicDialogOpen} onOpenChange={(open) => {
          setIsTopicDialogOpen(open);
          if (!open) resetTopicForm();
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
              <Label htmlFor="topicNameDialog">Názov témy <span className="text-destructive">*</span></Label>
              <Input id="topicNameDialog" value={topicName} onChange={(e) => setTopicName(e.target.value)} required placeholder="Napr. Limity a spojitosť funkcií" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="topicStatusDialog">Status</Label>
                    <Select value={topicStatus} onValueChange={(value) => setTopicStatus(value as TopicStatus)}>
                        <SelectTrigger id="topicStatusDialog"><SelectValue placeholder="Vyberte status" /></SelectTrigger>
                        <SelectContent>
                        {Object.values(TopicStatus).map(sVal => (<SelectItem key={sVal} value={sVal}>{formatEnumValue(sVal)}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="topicUserDifficultyDialog">Vnímaná náročnosť</Label>
                    <Select value={topicUserDifficulty} onValueChange={(value) => setTopicUserDifficulty(value as UserDifficulty | typeof NONE_VALUE_PLACEHOLDER)}>
                        <SelectTrigger id="topicUserDifficultyDialog"><SelectValue placeholder="Vyberte náročnosť" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE_VALUE_PLACEHOLDER}>Žiadna</SelectItem>
                            {Object.values(UserDifficulty).map(dVal => (<SelectItem key={dVal} value={dVal}>{formatEnumValue(dVal)}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topicUserStrengthsDialog">Silné stránky (poznámky)</Label>
              <Textarea id="topicUserStrengthsDialog" value={topicUserStrengths} onChange={(e) => setTopicUserStrengths(e.target.value)} placeholder="Čo ti v tejto téme ide dobre?" rows={2}/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="topicUserWeaknessesDialog">Slabé stránky (poznámky)</Label>
              <Textarea id="topicUserWeaknessesDialog" value={topicUserWeaknesses} onChange={(e) => setTopicUserWeaknesses(e.target.value)} placeholder="S čím máš v tejto téme problémy?" rows={2}/>
            </div>
            <DialogFooter className="pt-2">
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingTopic}>Zrušiť</Button></DialogClose>
                <Button type="submit" disabled={isSubmittingTopic || !topicName.trim()}>
                    {isSubmittingTopic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingTopic ? 'Uložiť zmeny' : 'Vytvoriť tému'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sekcia Študijný Plán */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <ListChecks className="mr-2 h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Študijný Plán</CardTitle>
          </div>
          {!studyPlan && !isLoadingPlan && subject && ( // Pridaná kontrola subject
            <Button onClick={handleGeneratePlan} disabled={isLoadingPlan || topics.length === 0}>
              <BrainCog className="mr-2 h-4 w-4" />
              {topics.length === 0 ? "Pridajte témy na generovanie" : "Vygenerovať Plán"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoadingPlan && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Spracovávam plán...</p>
            </div>
          )}
          {planError && !isLoadingPlan && (
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" /><AlertTitle>Chyba Plánu</AlertTitle><AlertDescription>{planError}</AlertDescription>
            </Alert>
          )}
          {!isLoadingPlan && !planError && studyPlan && (
            <div>
              <div className="mb-4 p-3 bg-muted/50 rounded-md">
                <h3 className="text-lg font-semibold">{studyPlan.name || `Plán pre ${subject?.name}`}</h3>
                <p className="text-sm text-muted-foreground">
                  Vytvorený: {new Date(studyPlan.created_at).toLocaleDateString('sk-SK')}
                  <Badge variant="outline" className="ml-2">{formatEnumValue(studyPlan.status)}</Badge>
                </p>
              </div>
              {sortedStudyBlocks.length > 0 ? (
                <div className="space-y-3">
                  {sortedStudyBlocks.map(block => (
                    <Card key={block.id} className={`transition-all duration-150
                      ${block.status === StudyBlockStatus.COMPLETED ? 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                      ${block.status === StudyBlockStatus.SKIPPED ? 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 opacity-80' : ''}
                      ${block.status === StudyBlockStatus.IN_PROGRESS ? 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                    `}>
                      <CardHeader className="p-3 sm:p-4 pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base sm:text-md">{block.topic.name}</CardTitle>
                            <Badge variant={
                                block.status === StudyBlockStatus.COMPLETED ? "default" :
                                block.status === StudyBlockStatus.IN_PROGRESS ? "secondary" :
                                block.status === StudyBlockStatus.SKIPPED ? "destructive" : "outline"
                            } className={`text-xs px-1.5 py-0.5
                                ${block.status === StudyBlockStatus.COMPLETED ? 'bg-green-600 hover:bg-green-700' : ''}
                                ${block.status === StudyBlockStatus.IN_PROGRESS ? 'bg-blue-600 hover:bg-blue-700' : ''}
                            `}>
                                {formatEnumValue(block.status)}
                            </Badge>
                        </div>
                        {block.scheduled_at && (
                          <CardDescription className="text-xs flex items-center pt-1">
                            <CalendarDays className="mr-1.5 h-3 w-3" />
                            Naplánované: {new Date(block.scheduled_at).toLocaleDateString('sk-SK', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {block.duration_minutes && <span className="ml-2 inline-flex items-center"><Hourglass className="mr-1 h-3 w-3" /> {block.duration_minutes} min</span>}
                          </CardDescription>
                        )}
                      </CardHeader>
                      {block.notes && <CardContent className="px-3 sm:px-4 pb-2 pt-0 text-xs italic text-muted-foreground">{block.notes}</CardContent>}
                      <CardFooter className="flex flex-wrap justify-end gap-2 px-3 sm:px-4 pt-1 pb-2 sm:pb-3">
                        {block.status !== StudyBlockStatus.COMPLETED && (
                          <Button variant="ghost" size="xs" className="text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => handleUpdateBlockStatus(block.id, StudyBlockStatus.COMPLETED)}>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Dokončené
                          </Button>
                        )}
                        {block.status !== StudyBlockStatus.IN_PROGRESS && block.status !== StudyBlockStatus.COMPLETED && (
                           <Button variant="ghost" size="xs" className="text-blue-600 hover:bg-blue-100 hover:text-blue-700" onClick={() => handleUpdateBlockStatus(block.id, StudyBlockStatus.IN_PROGRESS)}>
                             <Zap className="mr-1 h-3.5 w-3.5" /> Začať
                           </Button>
                        )}
                        {block.status !== StudyBlockStatus.SKIPPED && block.status !== StudyBlockStatus.COMPLETED && (
                          <Button variant="ghost" size="xs" className="text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => handleUpdateBlockStatus(block.id, StudyBlockStatus.SKIPPED)}>
                            <XCircle className="mr-1 h-3.5 w-3.5" /> Preskočiť
                          </Button>
                        )}
                         {block.status === StudyBlockStatus.COMPLETED && (
                           <Button variant="ghost" size="xs" className="text-muted-foreground hover:bg-gray-100 hover:text-gray-700" onClick={() => handleUpdateBlockStatus(block.id, StudyBlockStatus.PLANNED)}>
                             <Hourglass className="mr-1 h-3.5 w-3.5" /> Znova plánovať
                           </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Pre tento plán neboli nájdené žiadne študijné bloky.</p>
                  <p className="mt-1 text-xs">Možno sú všetky témy dokončené, alebo plán ešte neobsahuje žiadne úlohy.</p>
                </div>
              )}
            </div>
          )}
           {!isLoadingPlan && !studyPlan && !planError && subject && ( // Pridaná kontrola subject
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                    <ListChecks className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-1">Študijný plán ešte nebol vygenerovaný.</p>
                    <Button onClick={handleGeneratePlan} disabled={isLoadingPlan || topics.length === 0} className="mt-4">
                        <BrainCog className="mr-2 h-4 w-4" />
                        {topics.length === 0 ? "Najprv pridajte témy" : "Vygenerovať študijný plán"}
                    </Button>
                </div>
           )}
        </CardContent>
      </Card>

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