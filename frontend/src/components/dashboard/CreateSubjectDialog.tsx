"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { PlusCircle, Loader2, BookOpen, ArrowRight, AlertCircle } from 'lucide-react'

interface CreateSubjectDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (name: string, description: string) => Promise<void>
  isSubmitting: boolean
  error: string | null
  triggerText?: string
  triggerVariant?: "default" | "outline"
}

export function CreateSubjectDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
  error,
  triggerText = "Pridať Nový Predmet",
  triggerVariant = "default",
}: CreateSubjectDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    await onSubmit(name.trim(), description.trim())
    
    // Reset form only if submission was successful (no error)
    if (!error) {
      setName("")
      setDescription("")
    }
  }

  const handleClose = () => {
    setName("")
    setDescription("")
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          variant={triggerVariant}
          className={
            triggerVariant === "default"
              ? "group bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              : "group bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl transition-all duration-300"
          }
        >
          <PlusCircle className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
          {triggerText}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Pridať Nový Predmet
          </DialogTitle>
          <DialogDescription className="text-base">
            Vytvor nový študijný predmet a začni organizovať svoje materiály a témy.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="subjectName" className="text-sm font-medium">
              Názov predmetu <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subjectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Napr. Kvantová Fyzika, Matematická Analýza..."
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subjectDescription" className="text-sm font-medium">
              Stručný popis
            </Label>
            <Textarea
              id="subjectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Čo tento predmet zahŕňa? Aké témy budete študovať?"
              rows={4}
              className="resize-none"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="gap-3">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleClose}>
                Zrušiť
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Vytvoriť predmet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
