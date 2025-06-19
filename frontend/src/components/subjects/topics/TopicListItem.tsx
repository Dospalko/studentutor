// frontend/src/components/subjects/TopicListItem.tsx
"use client";

import { Topic, analyzeTopicWithAI } from '@/services/topicService';
import { TopicStatus } from '@/types/study';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit3, Trash2, Brain, Clock4, Sparkles, Loader2 as ProcessingIcon, AlertCircle } from "lucide-react";
import { useState, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Pre tooltip
import { Alert, AlertDescription } from '@/components/ui/alert';

const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return 'N/A';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const getAiDifficultyLabelAndColor = (score: number | null | undefined): { label: string, colorClass: string, description: string } => {
    if (score === null || score === undefined) return { label: "Neznáma", colorClass: "text-muted-foreground", description: "AI náročnosť ešte nebola odhadnutá." };
    if (score <= 0.2) return { label: "Veľmi ľahká", colorClass: "text-green-600 dark:text-green-400", description: "AI odhad: Táto téma by mala byť veľmi jednoduchá na pochopenie." };
    if (score <= 0.4) return { label: "Ľahká", colorClass: "text-lime-600 dark:text-lime-400", description: "AI odhad: Táto téma je relatívne ľahká." };
    if (score <= 0.6) return { label: "Stredná", colorClass: "text-yellow-600 dark:text-yellow-500", description: "AI odhad: Táto téma má priemernú náročnosť." };
    if (score <= 0.8) return { label: "Ťažká", colorClass: "text-orange-600 dark:text-orange-400", description: "AI odhad: Táto téma môže byť náročnejšia." };
    return { label: "Veľmi ťažká", colorClass: "text-red-600 dark:text-red-500", description: "AI odhad: Táto téma je pravdepodobne veľmi náročná." };
};

interface TopicListItemProps {
  topic: Topic;
  onEdit: () => void;
  onDelete: () => void;
  onTopicUpdated: (updatedTopic: Topic) => void;
}

export default function TopicListItem({ topic, onEdit, onDelete, onTopicUpdated }: TopicListItemProps) {
  const authContext = useContext(AuthContext);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const aiDifficultyInfo = getAiDifficultyLabelAndColor(topic.ai_difficulty_score);

  const handleAiAnalysis = async () => {
    if (!authContext?.token) { setAnalysisError("Chyba autentifikácie."); return; }
    setIsAnalyzing(true); setAnalysisError(null);
    try {
      const updatedTopicWithAi = await analyzeTopicWithAI(topic.id, authContext.token);
      onTopicUpdated(updatedTopicWithAi);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "AI analýza zlyhala.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasAiData = topic.ai_difficulty_score !== null && topic.ai_difficulty_score !== undefined;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 ease-in-out">
      <CardHeader className="flex flex-row items-start justify-between bg-muted/30 dark:bg-muted/20 p-3 sm:p-4">
        <div className="flex-grow pr-2"><CardTitle className="text-md sm:text-lg font-semibold">{topic.name}</CardTitle></div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Upraviť ${topic.name}`} className="h-8 w-8"><Edit3 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/10 h-8 w-8" onClick={onDelete} aria-label={`Zmazať ${topic.name}`}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-2 text-sm">
        <div><Badge variant={topic.status === TopicStatus.COMPLETED ? "default" : topic.status === TopicStatus.IN_PROGRESS ? "secondary" : "outline"} className={`font-medium ${ topic.status === TopicStatus.COMPLETED ? 'bg-green-500 hover:bg-green-600 text-white' : topic.status === TopicStatus.IN_PROGRESS ? 'bg-blue-500 hover:bg-blue-600 text-white' : topic.status === TopicStatus.NEEDS_REVIEW ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' : 'border-border' }`}>Status: {formatEnumValue(topic.status)}</Badge></div>
        {topic.user_difficulty && (<p className="text-muted-foreground">Vaša náročnosť: <span className="font-semibold text-foreground">{formatEnumValue(topic.user_difficulty)}</span></p>)}
        
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center cursor-help ${hasAiData ? aiDifficultyInfo.colorClass : 'text-muted-foreground'}`}>
                <Brain className="mr-1.5 h-4 w-4" /> 
                <span>AI Náročnosť: {hasAiData ? aiDifficultyInfo.label : "N/A"}</span>
                {hasAiData && <span className="ml-1 text-xs">({topic.ai_difficulty_score?.toFixed(1)})</span>}
              </div>
            </TooltipTrigger>
            <TooltipContent><p>{aiDifficultyInfo.description}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {topic.ai_estimated_duration && (<p className="text-muted-foreground flex items-center"><Clock4 className="mr-1.5 h-4 w-4" /> AI Odhad Času: {topic.ai_estimated_duration} minút</p>)}
        
        {topic.user_strengths && (<p className="text-green-700 dark:text-green-500"><span className="font-semibold">Silné stránky:</span> {topic.user_strengths}</p>)}
        {topic.user_weaknesses && (<p className="text-red-700 dark:text-red-500"><span className="font-semibold">Slabé stránky:</span> {topic.user_weaknesses}</p>)}
        
        {analysisError && <Alert variant="destructive" className="mt-2 p-2 text-xs"><AlertCircle className="h-4 w-4" /><AlertDescription>{analysisError}</AlertDescription></Alert>}
      </CardContent>
      {/* Zobraz tlačidlo len ak AI dáta ešte neexistujú */}
      {!hasAiData && (
        <CardFooter className="p-3 sm:p-4 border-t bg-muted/20 dark:bg-muted/10 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleAiAnalysis} disabled={isAnalyzing} className="text-xs">
            {isAnalyzing ? <ProcessingIcon className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500"/>}
            {isAnalyzing ? "Analyzujem..." : "Získať AI Odhad"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}