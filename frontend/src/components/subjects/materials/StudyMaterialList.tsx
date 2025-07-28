"use client"

import { useState, useContext, useMemo, useEffect } from "react"
import { type StudyMaterial, fetchProtectedFileAsBlobUrl, downloadProtectedFile } from "@/services/studyMaterialService"
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
  Filter,
  Search,
  Sparkles,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import SimplePdfViewer from "@/components/subjects/materials/SimplePdfViewer"

/* ---------- helpers ---------------------------------------------------- */
const formatEnum = (v?: string | null) => (!v ? "N/A" : v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))

const formatSize = (b?: number | null) => {
  if (b == null) return "N/A"
  if (b === 0) return "0 B"
  const k = 1024
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${Number.parseFloat((b / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

const ftColor = (ft: string | null) => {
  if (!ft) return "bg-muted/50 text-muted-foreground border-muted"
  const t = ft.toLowerCase()
  if (t.includes("pdf")) return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200"
  if (t.includes("doc")) return "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200"
  if (t.includes("image")) return "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200"
  if (t.includes("text")) return "bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200"
  return "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200"
}

/* ---------------------------------------------------------------------- */
interface Props {
  materials: StudyMaterial[]
  onDeleteMaterial: (id: number) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

type PdfState = { materialId: number; blobUrl: string; title: string; fileType: string | null } | null

export default function StudyMaterialList({ materials: init, onDeleteMaterial, isLoading, error }: Props) {
  const [materials, setMaterials] = useState<StudyMaterial[]>(init)
  const [pdfView, setPdfView] = useState<PdfState>(null)
  const [procId, setProcId] = useState<number | null>(null)
  const [delId, setDelId] = useState<number | null>(null)
  const [filter, setFilter] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const { token } = useContext(AuthContext) ?? {}

  useEffect(() => setMaterials(init), [init])

  /* ---------- TAGS & filter ---------- */
  const allTags = useMemo(() => {
    const s = new Set<string>()
    materials.forEach((m) => (m.tags ?? []).forEach((t) => s.add(t)))
    return [...s].sort()
  }, [materials])

  const visible = useMemo(() => {
    let filtered = materials

    // Filter by tags
    if (filter.length > 0) {
      filtered = filtered.filter((m) => filter.every((t) => (m.tags ?? []).includes(t)))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (m) =>
          (m.title || m.file_name).toLowerCase().includes(query) ||
          (m.description || "").toLowerCase().includes(query) ||
          (m.tags ?? []).some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    return filtered
  }, [materials, filter, searchQuery])

  const patch = (id: number, p: Partial<StudyMaterial>) =>
    setMaterials((list) => list.map((m) => (m.id === id ? { ...m, ...p } : m)))

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
      const pdf = fileType?.includes("pdf") || m.file_name.toLowerCase().endsWith(".pdf")
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
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="py-16 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-secondary/20 rounded-full flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-secondary" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium text-lg">Načítavam materiály...</p>
            <p className="text-sm text-muted-foreground">Pripravujeme váš obsah</p>
          </div>
        </CardContent>
      </Card>
    )

  if (error)
    return (
      <Alert variant="destructive" className="border-2 border-destructive/20 bg-destructive/5 shadow-lg">
        <AlertCircle className="h-5 w-5" />
        <AlertDescription className="text-base">
          <b>Chyba pri načítavaní:</b> {error}
        </AlertDescription>
      </Alert>
    )

  if (materials.length === 0)
    return (
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-lg">
        <CardContent className="py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="mb-8 relative">
              <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center shadow-lg">
                <BookOpen className="w-12 h-12 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-secondary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Zatiaľ žiadne materiály</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Nahrajte svoj prvý študijný materiál a začnite organizovať svoje poznámky.
            </p>
          </div>
        </CardContent>
      </Card>
    )

  if (visible.length === 0)
    return (
      <Card className="border-2 border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-900/10 shadow-lg">
        <CardContent className="py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-amber-800 dark:text-amber-300">Žiadne výsledky pre filter</h3>
            <p className="text-amber-600 dark:text-amber-400 mb-4">Skúste zmeniť vyhľadávanie alebo vymazať filtre.</p>
            <Button
              variant="outline"
              onClick={() => {
                setFilter([])
                setSearchQuery("")
              }}
              className="bg-transparent border-amber-300 text-amber-600 hover:bg-amber-100"
            >
              Vymazať filtre
            </Button>
          </div>
        </CardContent>
      </Card>
    )

  /* ---------- render ---------- */
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Enhanced Header + Controls */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-lg">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 shadow-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Materiály</CardTitle>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="gap-1 bg-white/50 dark:bg-black/50">
                      <BookOpen className="h-3 w-3" />
                      {visible.length}/{materials.length} materiálov
                    </Badge>
                    {filter.length > 0 && (
                      <Badge variant="outline" className="gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                        <Filter className="h-3 w-3" />
                        {filter.length} filtrov
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Vyhľadať materiály..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-black/50 backdrop-blur-sm border-primary/20"
                />
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mr-4">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filtre:</span>
                </div>
                {allTags.map((tag) => {
                  const active = filter.includes(tag)
                  return (
                    <Badge
                      key={tag}
                      onClick={() => setFilter((f) => (active ? f.filter((t) => t !== tag) : [...f, tag]))}
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                        active
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted/70 border-muted"
                      }`}
                    >
                      #{tag}
                    </Badge>
                  )
                })}
                {filter.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 ml-2" onClick={() => setFilter([])}>
                    <X className="h-3 w-3 mr-1" />
                    Vymazať
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Materials Grid */}
        <div className="grid gap-6">
          {visible.map((m, i) => (
            <Card
              key={m.id}
              className="group hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:scale-[1] overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Content */}
                  <div className="flex gap-4 flex-grow min-w-0">
                    <div className="p-3 rounded-xl text-primary flex-shrink-0 ">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h4
                            className="font-bold text-lg truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleView(m)}
                          >
                            {m.title || m.file_name}
                          </h4>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium">{m.title || m.file_name}</p>
                          {m.description && <p className="text-sm opacity-80 mt-1">{m.description}</p>}
                        </TooltipContent>
                      </Tooltip>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <Badge variant="outline" className="gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatSize(m.file_size)}
                        </Badge>
                        {m.material_type && (
                          <Badge variant="secondary" className="gap-1">
                            <BookOpen className="h-3 w-3" />
                            {formatEnum(m.material_type)}
                          </Badge>
                        )}
                        {m.file_type && (
                          <Badge className={`gap-1 border ${ftColor(m.file_type)}`}>
                            <FileText className="h-3 w-3" />
                            {m.file_type.split("/")[1]?.toUpperCase() ?? "FILE"}
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(m.uploaded_at).toLocaleDateString("sk-SK")}
                        </Badge>
                      </div>

                      {/* Tags */}
                      {(m.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {(m.tags ?? []).map((t) => (
                            <Badge
                              key={t}
                              variant="outline"
                              className="text-xs bg-primary/5 text-primary border-primary/20"
                            >
                              #{t}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Description */}
                      {m.description && (
                        <p className="text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{m.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 flex-shrink-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(m)}
                          disabled={procId === m.id}
                          className="h-10 w-10 p-0 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                        >
                          {procId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zobraziť / Otvoriť</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(m)}
                          disabled={procId === m.id}
                          className="h-10 w-10 p-0 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
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

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(m.id)}
                          disabled={delId === m.id}
                          className="h-10 w-10 p-0 text-destructive hover:bg-destructive/10 hover:border-destructive/30"
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
      </div>

      {/* PDF Dialog */}
      <SimplePdfViewer
        isOpen={!!pdfView}
        onOpenChange={(o) => !o && setPdfView(null)}
        blobUrl={pdfView?.blobUrl ?? null}
        title={pdfView?.title}
        materialId={pdfView?.materialId ?? 0}
        onTagsGenerated={(id, tags) => patch(id, { tags })}
        onSummaryGenerated={(id, s) => patch(id, { summary: s })}
      />
    </TooltipProvider>
  )
}
