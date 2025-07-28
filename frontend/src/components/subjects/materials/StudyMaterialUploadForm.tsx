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
import {
  Loader2,
  UploadCloud,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  File,
  ImageIcon,
} from "lucide-react"
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
    switch (extension) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-blue-600" />
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <ImageIcon className="h-5 w-5 text-green-600" />
      case "txt":
        return <File className="h-5 w-5 text-gray-600" />
      default:
        return <FileText className="h-5 w-5 text-purple-600" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getMaterialTypeStyle = (type: MaterialTypeEnum) => {
    switch (type) {
      case MaterialTypeEnum.SKRIPTA:
        return "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
      case MaterialTypeEnum.KNIHA:
        return "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
      case MaterialTypeEnum.PREZENTACIA:
        return "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
      case MaterialTypeEnum.CVICENIA:
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
      case MaterialTypeEnum.TEST:
        return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl opacity-60" />

      <CardHeader className="relative z-10 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 shadow-lg">
            <Upload className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Nahrať Študijný Materiál
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-1">
              Pridajte nový súbor k tomuto predmetu s AI analýzou
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 bg-white/50 dark:bg-black/50">
              <ImageIcon className="h-3 w-3" />
              AI analýza
            </Badge>
            <Badge variant="outline" className="gap-1 bg-white/50 dark:bg-black/50">
              <ImageIcon className="h-3 w-3" />
              Auto tagy
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-8">
        {error && (
          <Alert variant="destructive" className="border-2 border-destructive/20 bg-destructive/5 shadow-lg">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="text-base font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Enhanced File Upload Area */}
          <div className="space-y-3">
            <Label htmlFor="material-file-input" className="text-base font-semibold flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-primary" />
              Súbor <span className="text-destructive">*</span>
            </Label>
            <div
              className={`relative border-3 border-dashed rounded-2xl p-8 transition-all duration-300 ${
                isDragOver
                  ? "border-primary bg-primary/10 scale-105"
                  : selectedFile
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20 shadow-lg"
                    : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30"
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
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 shadow-lg">
                      <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-green-700 dark:text-green-300 mb-2">
                        Súbor úspešne vybraný!
                      </p>
                      <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                        {getFileIcon(selectedFile.name)}
                        <span className="font-medium">{selectedFile.name}</span>
                        <Badge variant="outline" className="bg-white/70 dark:bg-black/70">
                          {formatFileSize(selectedFile.size)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-primary/10 shadow-lg">
                      <UploadCloud className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-xl mb-2">Kliknite alebo pretiahnite súbor sem</p>
                      <p className="text-muted-foreground mb-4">
                        Podporované formáty: PDF, DOC, DOCX, TXT, obrázky a ďalšie
                      </p>
                      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          PDF
                        </div>
                        <div className="flex items-center gap-1">
                          <File className="h-4 w-4" />
                          DOC
                        </div>
                        <div className="flex items-center gap-1">
                          <ImageIcon className="h-4 w-4" />
                          IMG
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Form Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Title Field */}
            <div className="space-y-3">
              <Label htmlFor="material-title" className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Názov materiálu
              </Label>
              <Input
                id="material-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Napr. Prednáška 1: Úvod do..."
                className="h-12 text-base border-2 focus:border-primary/50"
              />
              <p className="text-sm text-muted-foreground">Ak nevyplníte, použije sa názov súboru</p>
            </div>

            {/* Material Type */}
            <div className="space-y-3">
              <Label htmlFor="material-type" className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Typ materiálu
              </Label>
              <Select
                value={materialType}
                onValueChange={(value) => setMaterialType(value === "none" ? "" : (value as MaterialTypeEnum))}
              >
                <SelectTrigger id="material-type" className="h-12 border-2 focus:border-primary/50">
                  <SelectValue placeholder="Vyberte typ materiálu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Žiadny</span>
                  </SelectItem>
                  {Object.values(MaterialTypeEnum).map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getMaterialTypeStyle(type)}`} />
                        <span className="font-medium">{formatEnumValue(type)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <Label htmlFor="material-description" className="text-base font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Popis materiálu
            </Label>
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <Textarea
                  id="material-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Stručný popis obsahu materiálu pre lepšiu AI analýzu..."
                  rows={4}
                  className="resize-none border-0 bg-transparent focus-visible:ring-0 text-base"
                />
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              Detailný popis pomôže AI lepšie analyzovať a kategorizovať materiál
            </p>
          </div>

          {/* Enhanced Submit Button */}
          <Button
            type="submit"
            disabled={isUploading || !selectedFile}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl group"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Nahrávam materiál...
              </>
            ) : (
              <>
                <UploadCloud className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
                Nahrať materiál
                <Sparkles className="ml-3 h-5 w-5 opacity-60 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </Button>

          {/* AI Features Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <ImageIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">AI Analýza</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Automatické spracovanie</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <ImageIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">Auto Tagy</p>
                <p className="text-xs text-green-600 dark:text-green-400">Inteligentné označenie</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Súhrny</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Automatické generovanie</p>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
