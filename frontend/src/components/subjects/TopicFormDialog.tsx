// frontend/src/components/subjects/TopicFormDialog.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Topic, TopicCreate, TopicUpdate } from '@/services/topicService'; // Uprav cestu ak treba
import { TopicStatus, UserDifficulty } from '@/types/study';

const NONE_VALUE_PLACEHOLDER = "_none_";

// Pomocná funkcia na formátovanie enum hodnôt
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

interface TopicFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingTopic: Topic | null;
  subjectName: string | undefined;
  // onSubmit vracia Promise, aby sme vedeli, kedy sa dokončí
  onSubmit: (data: TopicCreate | TopicUpdate, editingTopicId?: number) => Promise<void>;
  isSubmitting: boolean; // Pre disable tlačidla
}

export default function TopicFormDialog({
  isOpen,
  onOpenChange,
  editingTopic,
  subjectName,
  onSubmit,
  isSubmitting
}: TopicFormDialogProps) {
  const [topicName, setTopicName] = useState('');
  const [topicUserStrengths, setTopicUserStrengths] = useState('');
  const [topicUserWeaknesses, setTopicUserWeaknesses] = useState('');
  const [topicUserDifficulty, setTopicUserDifficulty] = useState<UserDifficulty | typeof NONE_VALUE_PLACEHOLDER>(NONE_VALUE_PLACEHOLDER);
  const [topicStatus, setTopicStatus] = useState<TopicStatus>(TopicStatus.NOT_STARTED);
  const [formError, setFormError] = useState<string | null>(null);


  useEffect(() => {
    if (isOpen) { // Reset alebo naplnenie formulára pri každom otvorení
        if (editingTopic) {
            setTopicName(editingTopic.name);
            setTopicUserStrengths(editingTopic.user_strengths || '');
            setTopicUserWeaknesses(editingTopic.user_weaknesses || '');
            setTopicUserDifficulty(editingTopic.user_difficulty || NONE_VALUE_PLACEHOLDER);
            setTopicStatus(editingTopic.status);
        } else {
            setTopicName('');
            setTopicUserStrengths('');
            setTopicUserWeaknesses('');
            setTopicUserDifficulty(NONE_VALUE_PLACEHOLDER);
            setTopicStatus(TopicStatus.NOT_STARTED);
        }
        setFormError(null); // Vyčisti chybu formulára
    }
  }, [isOpen, editingTopic]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) {
      setFormError("Názov témy je povinný.");
      return;
    }
    setFormError(null);

    const difficultyToSend = topicUserDifficulty === NONE_VALUE_PLACEHOLDER ? undefined : topicUserDifficulty;
    const commonData = {
      name: topicName.trim(),
      user_strengths: topicUserStrengths.trim() || undefined,
      user_weaknesses: topicUserWeaknesses.trim() || undefined,
      user_difficulty: difficultyToSend,
      status: topicStatus,
    };

    if (editingTopic) {
        const updateData: TopicUpdate = { ...commonData };
        if (!topicUserStrengths.trim()) updateData.user_strengths = null;
        if (!topicUserWeaknesses.trim()) updateData.user_weaknesses = null;
        if (topicUserDifficulty === NONE_VALUE_PLACEHOLDER) updateData.user_difficulty = null;
        await onSubmit(updateData, editingTopic.id);
    } else {
        const createData: TopicCreate = { ...commonData };
        if(!createData.status) createData.status = TopicStatus.NOT_STARTED;
        await onSubmit(createData);
    }
    // Zatvorenie dialógu a reset by mal manažovať rodičovský komponent po úspešnom onSubmit
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{editingTopic ? 'Upraviť tému' : 'Pridať novú tému'}</DialogTitle>
          {subjectName && (
            <DialogDescription>
              {editingTopic ? `Upravujete tému "${editingTopic.name}".` : `Pridávate novú tému k predmetu "${subjectName}".`}
            </DialogDescription>
          )}
        </DialogHeader>
        {formError && <p className="text-sm text-destructive px-6 -mt-2">{formError}</p>}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 px-6 pb-4">
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
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Zrušiť</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting || !topicName.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTopic ? 'Uložiť zmeny' : 'Vytvoriť tému'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}