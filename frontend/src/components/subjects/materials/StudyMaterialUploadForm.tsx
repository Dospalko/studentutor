"use client"

import type React from "react"

import { useState, type FormEvent, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, UploadCloud, FileText, Upload, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react"
import { MaterialTypeEnum } from "@/types/study"
import type { StudyMaterialMetadata } from "@/services/studyMaterialService"
import type { StudyMaterial } from "@/services/studyMaterialService"

// Pomocná funkcia na formátovanie enum hodnôt
const formatEnumValue = (value: string): string => {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

interface StudyMaterialUploadFormProps {
  subjectId: number
  onUploadSuccess: (newMaterial: StudyMaterial) => void
  token: string | null
}

export default function StudyMaterialUploadForm({ subjectId, onUploadSuccess, token }: StudyMaterialUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [materialType, setMaterialType] = useState<MaterialTypeEnum | "">("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0])
    } else {
      setSelectedFile(null)
    }
  }

  const processFile = (file: File) => {
    setSelectedFile(file)
    // Automaticky vyplň titulok názvom súboru (bez koncovky), ak je prázdny
    if (!title.trim()) {
      const fileNameWithoutExtension = file.name.split(".").slice(0, -1).join(".")
      setTitle(fileNameWithoutExtension || file.name)
    }
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      processFile(files[0])
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedFile) {
      setError("Prosím, vyberte súbor na nahratie.")
      return
    }
    if (!token) {
      setError("Chyba autentifikácie. Skúste sa znova prihlásiť.")
      return
    }

    setIsUploading(true)
    setError(null)

    const metadata: StudyMaterialMetadata = {
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      material_type: materialType || undefined,
    }

    try {
      const { uploadStudyMaterial } = await import("@/services/studyMaterialService")
      const newMaterial = await uploadStudyMaterial(subjectId, selectedFile, metadata, token)
      onUploadSuccess(newMaterial)

      // Resetuj formulár
      setSelectedFile(null)
      setTitle("")
      setDescription("")
      setMaterialType("")

      const fileInput = document.getElementById("material-file-input") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (err) {
      console.error("Upload failed:", err)
      setError(err instanceof Error ? err.message : "Neznáma chyba pri nahrávaní.")
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    
    // Now using the extension variable
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4" />
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  return (
    <Card className="border-muted/40 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Nahrať Študijný Materiál</CardTitle>
            <CardDescription>Pridajte nový súbor k tomuto predmetu</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6 border-destructive/20 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-2">
            <Label htmlFor="material-file-input" className="text-sm font-medium">
              Súbor <span className="text-destructive">*</span>
            </Label>

            <div
              className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                isDragOver
                  ? "border-primary bg-primary/5"
                  : selectedFile
                    ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                id="material-file-input"
                type="file"
                onChange={handleFileChange}
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="text-center">
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-300">Súbor vybraný</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {getFileIcon(selectedFile.name)}
                        <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(selectedFile.size)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10">
                      <UploadCloud className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Kliknite alebo pretiahnite súbor sem</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Podporované formáty: PDF, DOC, DOCX, TXT, a ďalšie
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="material-title" className="text-sm font-medium">
              Názov materiálu
            </Label>
            <Input
              id="material-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Napr. Prednáška 1: Úvod do..."
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">Ak nevyplníte, použije sa názov súboru</p>
          </div>

          {/* Material Type */}
          <div className="space-y-2">
            <Label htmlFor="material-type" className="text-sm font-medium">
              Typ materiálu
            </Label>
            <Select
              value={materialType}
              onValueChange={(value) => setMaterialType(value === "none" ? "" : (value as MaterialTypeEnum))}
            >
              <SelectTrigger id="material-type" className="h-11">
                <SelectValue placeholder="Vyberte typ materiálu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Žiadny</span>
                </SelectItem>
                {Object.values(MaterialTypeEnum).map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatEnumValue(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="material-description" className="text-sm font-medium">
              Popis
            </Label>
            <Textarea
              id="material-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Stručný popis obsahu materiálu..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="w-full h-11 text-base font-medium group"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Nahrávam materiál...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Nahrať materiál
                <Sparkles className="ml-2 h-4 w-4 opacity-60" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
