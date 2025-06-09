"use client";

import { useState, useEffect, FormEvent, useContext } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose
} from "@/components/ui/dialog";
import { Loader2, UserCircle } from "lucide-react";
import { updateCurrentUserProfile, UserUpdatePayload, User } from '@/services/userService';
import { AuthContext } from '@/context/AuthContext';

interface EditProfileDialogProps {
  currentUser: User | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProfileUpdateSuccess: (updatedUser: User) => void;
}

export default function EditProfileDialog({ 
  currentUser, 
  isOpen, 
  onOpenChange,
  onProfileUpdateSuccess 
}: EditProfileDialogProps) {
  const authContext = useContext(AuthContext);
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && isOpen) {
      setFullName(currentUser.full_name || '');
      setError(null);
    }
  }, [currentUser, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authContext?.token || !currentUser) {
      setError("Chyba: Nepodarilo sa overiť používateľa.");
      return;
    }
    
    const trimmedFullName = fullName.trim();
    // Ak je meno rovnaké (po orezaní), alebo ak je prázdne a predtým bolo null/prázdne
    if (trimmedFullName === (currentUser.full_name || '').trim()) {
        onOpenChange(false); 
        return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: UserUpdatePayload = {
      full_name: trimmedFullName === '' ? null : trimmedFullName,
    };

    try {
      const updatedUser = await updateCurrentUserProfile(payload, authContext.token);
      onProfileUpdateSuccess(updatedUser);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodarilo sa aktualizovať profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserCircle className="mr-2 h-5 w-5 text-primary"/> Upraviť Profil
          </DialogTitle>
          <DialogDescription>
            Zmeňte si svoje celé meno.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-profile-fullname">Celé meno</Label>
            <Input
              id="edit-profile-fullname"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Vaše meno a priezvisko"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>Zrušiť</Button>
            </DialogClose>
            <Button 
              type="submit" 
              disabled={isSubmitting || fullName.trim() === (currentUser.full_name || '').trim()}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Uložiť zmeny
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}