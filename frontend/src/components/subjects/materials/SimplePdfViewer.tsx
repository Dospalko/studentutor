// frontend/src/components/subjects/materials/SimplePdfViewer.tsx
"use client"

import { useEffect, useState, useContext } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Brain,
  Loader2,
  Edit2,
  Check,
} from "lucide-react"
import { AuthContext } from "@/context/AuthContext"
import {
  fetchMaterialSummary,
  fetchMaterialTags,
  generateMaterialSummary,
  generateMaterialTags,
  patchMaterial,
} from "@/services/studyMaterialService"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  isOpen: boolean
  onOpenChange: (o: boolean) => void
  blobUrl: string | null
  title?: string
  materialId: number
  onTagsGenerated?: (id: number, tags: string[]) => void
  onSummaryGenerated?: (id: number, summary: string | null) => void
}

export default function SimplePdfViewer({
  blobUrl,
  title,
  isOpen,
  onOpenChange,
  materialId,
  onTagsGenerated,
  onSummaryGenerated,
}: Props) {
  const { token } = useContext(AuthContext) ?? {}

  /* UI */
  const [pdfTitle, setPdfTitle] = useState("Dokument")
  const [frameLoading, setFrameLoading] = useState(true)

  /* AI data */
  const [summary, setSummary] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [sumErr, setSumErr] = useState<string | null>(null)
  const [tagErr, setTagErr] = useState<string | null>(null)

  /* edit mode */
  const [editMode, setEditMode] = useState(false)
  const [draftSummary, setDraftSummary] = useState<string>("")
  const [draftTags, setDraftTags] = useState<string[]>([])

  /* load existing AI data */
  useEffect(() => {
    if (!isOpen || !token || !materialId) return
    Promise.allSettled([
      fetchMaterialSummary(materialId, token),
      fetchMaterialTags(materialId, token),
    ]).then(([sumRes, tagRes]) => {
      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value.summary)
        setDraftSummary(sumRes.value.summary ?? "")
        setSumErr(sumRes.value.ai_error ?? null)
      }
      if (tagRes.status === "fulfilled") {
        setTags(tagRes.value)
        setDraftTags(tagRes.value)
      }
    })
  }, [isOpen, token, materialId])

  /* reset on close */
  useEffect(() => {
    if (!isOpen) {
      setEditMode(false)
      setDraftSummary("")
      setDraftTags([])
      setLoading(false)
      setSumErr(null)
      setTagErr(null)
    }
  }, [isOpen])

  useEffect(() => {
    setPdfTitle(title?.trim() || "Dokument")
  }, [title])

  /* generate AI */
  const handleGenerate = async () => {
    if (!token) return
    setLoading(true)
    setSumErr(null)
    setTagErr(null)
    try {
      const [s, t] = await Promise.all([
        generateMaterialSummary(materialId, token),
        generateMaterialTags(materialId, token),
      ])
      setSummary(s.summary)
      setDraftSummary(s.summary ?? "")
      setTags(t)
      setDraftTags(t)
      onSummaryGenerated?.(materialId, s.summary)
      onTagsGenerated?.(materialId, t)
    } catch (e) {
      const msg = (e as Error).message
      if (msg.toLowerCase().includes("tag")) setTagErr(msg)
      else setSumErr(msg)
    } finally {
      setLoading(false)
    }
  }

  /* save manual edits */
  const handleSaveEdits = async () => {
    if (!token) return
    setLoading(true)
    try {
      await patchMaterial(materialId, { ai_summary: draftSummary, tags: draftTags }, token)
      setSummary(draftSummary)
      setTags(draftTags)
      onSummaryGenerated?.(materialId, draftSummary)
      onTagsGenerated?.(materialId, draftTags)
      setEditMode(false)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const needAI = (!summary && !sumErr) || tags.length === 0

  if (!isOpen || !blobUrl) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] p-0 overflow-hidden flex flex-col">
        {/* HEADER */}
        <DialogHeader className="flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="p-2 rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate">{pdfTitle}</DialogTitle>
              <Badge variant="outline" className="text-xs mt-1">
                PDF Dokument
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const a = document.createElement("a")
                a.href = blobUrl
                a.download = `${pdfTitle}.pdf`
                a.click()
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(blobUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative bg-background">
            {frameLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <iframe
              src={blobUrl}
              className="w-full h-full border-none"
              title={pdfTitle}
              onLoad={() => setFrameLoading(false)}
            />
          </div>

          <div className="w-full sm:w-72 lg:w-96 border-l p-4 space-y-3 overflow-y-auto">
            <div className="flex justify-between items-center">
              <h4 className="flex items-center gap-2 font-semibold">
                <Brain className="h-4 w-4 text-primary" /> AI súhrn & tagy
              </h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditMode((v) => !v)}
                disabled={loading}
                title={editMode ? "Zrušiť úpravy" : "Upraviť AI výstupy"}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            {/* TAGS */}
            <div className="flex flex-wrap gap-2 text-xs">
              {(editMode ? draftTags : tags).map((t) => (
                <Badge
                  key={t}
                  variant={editMode ? "secondary" : "outline"}
                  className="flex items-center gap-1"
                >
                  #{t}
                  {editMode && (
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setDraftTags((arr) => arr.filter((x) => x !== t))
                      }
                    />
                  )}
                </Badge>
              ))}
              {editMode && (
                <input
                  type="text"
                  placeholder="Pridať tag"
                  className="border px-1 text-xs"
                  onKeyDown={(e) => {
                    const v = e.currentTarget.value.trim()
                    if (e.key === "Enter" && v && !draftTags.includes(v)) {
                      setDraftTags((arr) => [...arr, v])
                      e.currentTarget.value = ""
                    }
                  }}
                />
              )}
            </div>
            {tagErr && <p className="text-sm text-destructive">Chyba tagov: {tagErr}</p>}

            {/* SUMMARY */}
            {editMode ? (
              <Textarea
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                rows={6}
                className="w-full"
              />
            ) : (
              summary && (
                <div className="text-sm space-y-2">
                  {summary
                    .split("\n")
                    .filter((l) => l.trim().startsWith("•"))
                    .map((l, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-primary font-bold">•</span>
                        <span>{l.replace(/^•\s*/, "")}</span>
                      </div>
                    ))}
                  {summary.includes("Sumarizácia:") && (
                    <div className="pt-3 border-t text-muted-foreground">
                      <p className="whitespace-pre-wrap">
                        {summary.split("Sumarizácia:")[1].trim()}
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
            {sumErr && <p className="text-sm text-destructive">Chyba: {sumErr}</p>}

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 mt-2">
              {needAI && !loading && !editMode && (
                <Button variant="secondary" size="sm" onClick={handleGenerate}>
                  <Brain className="h-4 w-4 mr-2" /> Generovať AI
                </Button>
              )}
              {loading && (
                <p className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generujem…
                </p>
              )}
              {editMode && (
                <Button variant="default" size="sm" onClick={handleSaveEdits}>
                  <Check className="h-4 w-4 mr-1" /> Uložiť zmeny
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
