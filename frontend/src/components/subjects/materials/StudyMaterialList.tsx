"use client"

import { useState, useContext } from "react"
import {
  type StudyMaterial,
  fetchProtectedFileAsBlobUrl,
  downloadProtectedFile,
  getMaterialSummary,
} from "@/services/studyMaterialService"
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
} from "lucide-react"
import SimplePdfViewer from "@/components/subjects/materials/SimplePdfViewer"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/* ---------- helpers ---------- */
const formatEnumValue = (v?: string | null) =>
  !v ? "N/A" : v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

const formatFileSize = (bytes?: number | null) => {
  if (!bytes && bytes !== 0) return "N/A"
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const getFileTypeColor = (ft: string | null) => {
  if (!ft) return "bg-muted/50 text-muted-foreground"
  const t = ft.toLowerCase()
  if (t.includes("pdf")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
  if (t.includes("doc")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
  if (t.includes("image")) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
  if (t.includes("text")) return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
  return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
}
/* -------------------------------- */

interface StudyMaterialListProps {
  materials: StudyMaterial[]
  onDeleteMaterial: (id: number) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

type PdfState = {
  materialId: number
  blobUrl: string
  title: string
  fileType: string | null
} | null

export default function StudyMaterialList({
  materials,
  onDeleteMaterial,
  isLoading,
  error,
}: StudyMaterialListProps) {
  const [pdfView, setPdfView] = useState<PdfState>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const { token } = useContext(AuthContext) ?? {}

  /* ---------- handlers ---------- */
  const handleDelete = async (id: number) => {
    if (!confirm("Naozaj chcete zmazať tento materiál? Táto akcia je nenávratná.")) return
    setDeletingId(id)
    try {
      await onDeleteMaterial(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleView = async (m: StudyMaterial) => {
    if (!token) return alert("Chyba autentifikácie.")
    if (processingId === m.id) return
    setProcessingId(m.id)

    try {
      const { blobUrl, fileType } = await fetchProtectedFileAsBlobUrl(m.id, token)

      if (fileType?.toLowerCase().includes("pdf")) {
        setPdfView({
          materialId: m.id,
          blobUrl,
          title: m.title || m.file_name,
          fileType,
        })

        // ️⬇️  Volanie AI sumáru
        try {
          const res = await getMaterialSummary(m.id, token)
          setPdfView((s) =>
            s
              ? {
                  ...s,
                  summary: res.summary,
                  summaryLoading: false,
                  summaryError: res.ai_error,
                }
              : s
          )
        } catch (e) {
          setPdfView((s) =>
            s
              ? {
                  ...s,
                  summary: null,
                  summaryLoading: false,
                  summaryError: (e as Error).message,
                }
              : s
          )
        }
      } else {
        // iné typy – len otvor/stiahni
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = m.file_name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
      }
    } catch (e) {
      console.error(e)
      alert(`Nepodarilo sa zobraziť súbor: ${(e as Error).message}`)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDownload = async (m: StudyMaterial) => {
    if (!token) return alert("Chyba autentifikácie.")
    if (processingId === m.id) return
    setProcessingId(m.id)
    try {
      await downloadProtectedFile(m.id, m.file_name, token)
    } catch (e) {
      console.error(e)
      alert(`Nepodarilo sa stiahnuť: ${(e as Error).message}`)
    } finally {
      setProcessingId(null)
    }
  }
  /* -------------------------------- */

  /* ---------- loading / error states ---------- */
  if (isLoading)
    return (
      <Card className="border-muted/40">
        <CardContent className="py-12 text-center flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-medium">Načítavam materiály…</p>
        </CardContent>
      </Card>
    )

  if (error)
    return (
      <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <span className="font-medium">Chyba:</span> {error}
        </AlertDescription>
      </Alert>
    )

  if (materials.length === 0)
    return (
      <Card className="border-2 border-dashed border-border bg-muted/20">
        <CardContent className="py-16 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Žiadne materiály – nahrajte prvý súbor.</p>
        </CardContent>
      </Card>
    )

  /* ---------- default render ---------- */
  return (
    <TooltipProvider>
      {/* header */}
      <Card className="border-muted/40 mb-4">
        <CardHeader className="pb-4 flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-xl font-semibold">Študijné Materiály</CardTitle>
            <Badge variant="outline" className="text-xs mt-1">
              {materials.length} materiálov
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* list */}
      <div className="grid gap-4">
        {materials.map((m, i) => (
          <Card
            key={m.id}
            className="group hover:shadow-lg border-muted/40 hover:border-primary/40 transition"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* icon + meta */}
                <div className="flex gap-4 flex-grow min-w-0">
                  <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h4
                          className="font-semibold truncate cursor-pointer hover:text-primary"
                          onClick={() => handleView(m)}
                        >
                          {m.title || m.file_name}
                        </h4>
                      </TooltipTrigger>
                      <TooltipContent>{m.title || m.file_name}</TooltipContent>
                    </Tooltip>

                    {/* tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatFileSize(m.file_size)}
                      </span>
                      {m.material_type && (
                        <Badge variant="secondary">{formatEnumValue(m.material_type)}</Badge>
                      )}
                      {m.file_type && (
                        <Badge variant="outline" className={getFileTypeColor(m.file_type)}>
                          {m.file_type.split("/")[1]?.toUpperCase() ?? "FILE"}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(m.uploaded_at).toLocaleDateString("sk-SK")}
                      </span>
                    </div>

                    {m.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                    )}
                  </div>
                </div>

                {/* actions */}
                <div className="flex gap-2 flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                  {/* view */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(m)}
                        disabled={processingId === m.id}
                        className="h-8 w-8 p-0 sm:h-9 sm:px-3"
                      >
                        {processingId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zobraziť / Otvoriť</TooltipContent>
                  </Tooltip>

                  {/* download */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(m)}
                        disabled={processingId === m.id}
                        className="h-8 w-8 p-0 sm:h-9 sm:px-3"
                      >
                        {processingId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stiahnuť súbor</TooltipContent>
                  </Tooltip>

                  {/* delete */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        className="h-8 w-8 p-0 sm:h-9 sm:px-3 text-destructive hover:bg-destructive/10"
                      >
                        {deletingId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zmazať materiál</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* PDF viewer + AI summary */}
      <SimplePdfViewer
  isOpen={!!pdfView}
  onOpenChange={(o) => !o && setPdfView(null)}
  blobUrl={pdfView?.blobUrl ?? null}
  title={pdfView?.title}
  materialId={pdfView?.materialId ?? 0}  
/>
    </TooltipProvider>
  )
}
