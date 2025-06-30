/* ----------------------------------------------------------------------- */
/*  StudyMaterialList – live filter + sync po AI generovaní                */
/* ----------------------------------------------------------------------- */
"use client"

import { useState, useContext, useMemo, useEffect } from "react"
import {
  type StudyMaterial,
  fetchProtectedFileAsBlobUrl,
  downloadProtectedFile,
} from "@/services/studyMaterialService"
import { AuthContext } from "@/context/AuthContext"

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
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

import SimplePdfViewer from "@/components/subjects/materials/SimplePdfViewer"

/* ---------- helpers ---------------------------------------------------- */
const formatEnum = (v?: string | null) =>
  !v ? "N/A" : v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())

const formatSize = (b?: number | null) => {
  if (b == null) return "N/A"
  if (b === 0) return "0 B"
  const k = 1024
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

const ftColor = (ft: string | null) => {
  if (!ft) return "bg-muted/50 text-muted-foreground"
  const t = ft.toLowerCase()
  if (t.includes("pdf"))   return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
  if (t.includes("doc"))   return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
  if (t.includes("image")) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
  if (t.includes("text"))  return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
  return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
}
/* ---------------------------------------------------------------------- */

interface Props {
  materials: StudyMaterial[]
  onDeleteMaterial: (id: number) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

type PdfState =
  | { materialId: number; blobUrl: string; title: string; fileType: string | null }
  | null

export default function StudyMaterialList({
  materials: init,
  onDeleteMaterial,
  isLoading,
  error,
}: Props) {
  const [materials, setMaterials] = useState<StudyMaterial[]>(init)
  const [pdfView,  setPdfView]    = useState<PdfState>(null)
  const [procId,   setProcId]     = useState<number | null>(null)
  const [delId,    setDelId]      = useState<number | null>(null)
  const [filter,   setFilter]     = useState<string[]>([])
  const { token }  = useContext(AuthContext) ?? {}

  useEffect(() => setMaterials(init), [init])

  /* ---------- TAGS & filter ---------- */
  const allTags = useMemo(() => {
    const s = new Set<string>()
    materials.forEach(m => (m.tags ?? []).forEach(t => s.add(t)))
    return [...s].sort()
  }, [materials])

  const visible = useMemo(
    () =>
      filter.length === 0
        ? materials
        : materials.filter(m => filter.every(t => (m.tags ?? []).includes(t))),
    [materials, filter]
  )

  const patch = (id: number, p: Partial<StudyMaterial>) =>
    setMaterials(list => list.map(m => (m.id === id ? { ...m, ...p } : m)))

  /* ---------- handlers ---------- */
  const handleDelete = async (id: number) => {
    if (!confirm("Naozaj chcete zmazať tento materiál?")) return
    setDelId(id)
    try {
      await onDeleteMaterial(id)
    } finally {
      setDelId(null)
    }
  }

  const handleView = async (m: StudyMaterial) => {
    if (!token) return alert("Chyba autentifikácie.")
    if (procId === m.id) return
    setProcId(m.id)
    try {
      const { blobUrl, fileType } = await fetchProtectedFileAsBlobUrl(m.id, token)
      const pdf = (fileType?.includes("pdf") || m.file_name.toLowerCase().endsWith(".pdf"))
      if (pdf) {
        setPdfView({ materialId: m.id, blobUrl, title: m.title || m.file_name, fileType })
      } else {
        const a = document.createElement("a")
        a.href = blobUrl
        a.download = m.file_name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
      }
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setProcId(null)
    }
  }

  const handleDownload = async (m: StudyMaterial) => {
    if (!token) return alert("Chyba autentifikácie.")
    setProcId(m.id)
    try {
      await downloadProtectedFile(m.id, m.file_name, token)
    } finally {
      setProcId(null)
    }
  }

  /* ---------- loading / error UI ---------- */
  if (isLoading)
    return (
      <Card className="border-muted/40">
        <CardContent className="py-12 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Načítavam materiály…</p>
        </CardContent>
      </Card>
    )

  if (error)
    return (
      <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <b>Chyba:</b> {error}
        </AlertDescription>
      </Alert>
    )

  if (visible.length === 0)
    return (
      <Card className="border-2 border-dashed bg-muted/20">
        <CardContent className="py-16 text-center">
          <BookOpen className="w-10 h-10 mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Žiadne materiály pre zvolený filter.</p>
        </CardContent>
      </Card>
    )

  /* ---------- render ---------- */
  return (
    <TooltipProvider>
      {/* HEADER + filter */}
      <Card className="border-muted/40 mb-4">
        <CardHeader className="pb-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Študijné Materiály</CardTitle>
            <Badge variant="outline" className="text-xs">
              {visible.length}/{materials.length}
            </Badge>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {allTags.map(tag => {
                const active = filter.includes(tag)
                return (
                  <Badge
                    key={tag}
                    onClick={() =>
                      setFilter(f => (active ? f.filter(t => t !== tag) : [...f, tag]))
                    }
                    className={`cursor-pointer ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    #{tag}
                  </Badge>
                )
              })}
              {filter.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1"
                  onClick={() => setFilter([])}
                  title="Vymazať filter"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* LIST */}
      <div className="grid gap-4">
        {visible.map((m, i) => (
          <Card
            key={m.id}
            className="group hover:shadow-lg border-muted/40 hover:border-primary/40 transition"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* META */}
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

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {formatSize(m.file_size)}
                      </span>
                      {m.material_type && (
                        <Badge variant="secondary">{formatEnum(m.material_type)}</Badge>
                      )}
                      {m.file_type && (
                        <Badge variant="outline" className={ftColor(m.file_type)}>
                          {m.file_type.split("/")[1]?.toUpperCase() ?? "FILE"}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(m.uploaded_at).toLocaleDateString("sk-SK")}
                      </span>
                    </div>

                    {(m.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(m.tags ?? []).map(t => (
                          <Badge key={t} variant="outline" className="text-[10px]">
                            #{t}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {m.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {m.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2 flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                  {/* view */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(m)}
                        disabled={procId === m.id}
                        className="h-8 w-8 p-0 sm:h-9 sm:px-3"
                      >
                        {procId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
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
                        disabled={procId === m.id}
                        className="h-8 w-8 p-0 sm:h-9 sm:px-3"
                      >
                        {procId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
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
                        disabled={delId === m.id}
                        className="h-8 w-8 p-0 sm:h-9 sm:px-3 text-destructive hover:bg-destructive/10"
                      >
                        {delId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
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

      {/* PDF dialóg */}
      <SimplePdfViewer
        isOpen={!!pdfView}
        onOpenChange={o => !o && setPdfView(null)}
        blobUrl={pdfView?.blobUrl ?? null}
        title={pdfView?.title}
        materialId={pdfView?.materialId ?? 0}
        /* ↓–– realtime sync ––↓ */
        onTagsGenerated={(id, tags) => patch(id, { tags })}
        onSummaryGenerated={(id, s) => patch(id, { summary: s })}
      />
    </TooltipProvider>
  )
}
