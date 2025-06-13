"use client"

import { useState, useContext } from "react"
import { type StudyMaterial, fetchProtectedFileAsBlobUrl, downloadProtectedFile } from "@/services/studyMaterialService"
import { AuthContext } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Download,
  Trash2,
  AlertCircle,
  Loader2,
  Eye,
  Calendar,
  HardDrive,
  BookOpen,
  Sparkles,
} from "lucide-react"
import SimplePdfViewer from "@/components/subjects/materials/SimplePdfViewer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const formatEnumValue = (value: string | undefined | null): string => {
  if (!value || typeof value !== "string") return "N/A"
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatFileSize = (bytes?: number | null): string => {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return "N/A"
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

const getFileTypeColor = (fileType: string | null) => {
  if (!fileType) return "bg-muted/50 text-muted-foreground"

  const type = fileType.toLowerCase()
  if (type.includes("pdf")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
  if (type.includes("doc")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
  if (type.includes("image")) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
  if (type.includes("text")) return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
  return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
}

interface StudyMaterialListProps {
  materials: StudyMaterial[]
  onDeleteMaterial: (materialId: number) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export default function StudyMaterialList({ materials, onDeleteMaterial, isLoading, error }: StudyMaterialListProps) {
  const [pdfViewerState, setPdfViewerState] = useState<{
    blobUrl: string
    title: string
    fileType: string | null
  } | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const authContext = useContext(AuthContext)

  const handleDeleteClick = async (materialId: number) => {
    if (!confirm("Naozaj chcete zmazať tento materiál? Táto akcia je nenávratná.")) {
      return
    }

    setIsDeleting(materialId)
    try {
      await onDeleteMaterial(materialId)
    } catch {
      // Error handling is done in parent component
    } finally {
      setIsDeleting(null)
    }
  }

  const handleViewFile = async (material: StudyMaterial) => {
    if (!authContext?.token) {
      alert("Chyba autentifikácie.")
      return
    }
    if (isProcessingFile === material.id) return

    setIsProcessingFile(material.id)
    try {
      const { blobUrl, fileType } = await fetchProtectedFileAsBlobUrl(material.id, authContext.token)
      if (fileType && fileType.toLowerCase().includes("pdf")) {
        setPdfViewerState({
          blobUrl: blobUrl,
          title: material.title || material.file_name,
          fileType: fileType,
        })
      } else {
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = material.file_name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(blobUrl)
      }
    } catch (err) {
      console.error("Failed to view/process file:", err)
      alert(`Nepodarilo sa zobraziť/spracovať súbor: ${(err as Error).message}`)
    } finally {
      setIsProcessingFile(null)
    }
  }

  const handleDownloadClick = async (material: StudyMaterial) => {
    if (!authContext?.token) {
      alert("Chyba autentifikácie.")
      return
    }
    if (isProcessingFile === material.id) return

    setIsProcessingFile(material.id)
    try {
      await downloadProtectedFile(material.id, material.file_name, authContext.token)
    } catch (err) {
      console.error("Download failed:", err)
      alert(`Nepodarilo sa stiahnuť súbor: ${(err as Error).message}`)
    } finally {
      setIsProcessingFile(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-muted/40">
        <CardContent className="py-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div>
              <p className="font-medium">Načítavam materiály...</p>
              <p className="text-sm text-muted-foreground">Prosím čakajte</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Chyba pri načítavaní materiálov:</span> {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (materials.length === 0) {
    return (
      <Card className="border-2 border-dashed border-border bg-muted/20">
        <CardContent className="py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-6 relative">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-secondary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3">Žiadne študijné materiály</h3>
            <p className="text-muted-foreground leading-relaxed">
              K tomuto predmetu zatiaľ neboli pridané žiadne súbory. Začnite nahraním svojho prvého materiálu.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <Card className="border-muted/40">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Študijné Materiály</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {materials.length} materiálov
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4">
          {materials.map((material, index) => (
            <Card
              key={material.id}
              className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border-muted/40 hover:border-primary/40"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-grow min-w-0">
                    <div className="p-3 rounded-lg bg-muted/30 flex-shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>

                    <div className="flex-grow overflow-hidden">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h4
                            className={`text-base font-semibold truncate cursor-pointer transition-colors ${
                              material.file_type && material.file_type.toLowerCase().includes("pdf")
                                ? "hover:text-primary"
                                : "hover:text-primary"
                            }`}
                            onClick={() => handleViewFile(material)}
                            title={material.title || material.file_name}
                          >
                            {material.title || material.file_name}
                          </h4>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{material.title || material.file_name}</p>
                        </TooltipContent>
                      </Tooltip>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <HardDrive className="h-3 w-3" />
                          <span>{formatFileSize(material.file_size)}</span>
                        </div>

                        {material.material_type && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            {formatEnumValue(material.material_type)}
                          </Badge>
                        )}

                        {material.file_type && (
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-0.5 ${getFileTypeColor(material.file_type)}`}
                          >
                            {material.file_type.split("/")[1]?.toUpperCase() || "FILE"}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>Nahrané: {new Date(material.uploaded_at).toLocaleDateString("sk-SK")}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {new Date(material.uploaded_at).toLocaleString("sk-SK", {
                                dateStyle: "long",
                                timeStyle: "short",
                              })}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {material.description && (
                        <p
                          className="text-sm text-muted-foreground mt-2 italic line-clamp-2"
                          title={material.description}
                        >
                          {material.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewFile(material)}
                          disabled={isProcessingFile === material.id}
                          className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                        >
                          {isProcessingFile === material.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline ml-2">Zobraziť</span>
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {material.file_type && material.file_type.toLowerCase().includes("pdf")
                            ? "Zobraziť PDF"
                            : "Otvoriť súbor"}
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadClick(material)}
                          disabled={isProcessingFile === material.id}
                          className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                        >
                          {isProcessingFile === material.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              <span className="hidden sm:inline ml-2">Stiahnuť</span>
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Stiahnuť súbor</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(material.id)}
                          disabled={isDeleting === material.id}
                          className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {isDeleting === material.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline ml-2">Zmazať</span>
                            </>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Zmazať materiál</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <SimplePdfViewer
        isOpen={!!pdfViewerState}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPdfViewerState(null)
        }}
        blobUrl={pdfViewerState?.blobUrl || null}
        title={pdfViewerState?.title}
      />
    </TooltipProvider>
  )
}
