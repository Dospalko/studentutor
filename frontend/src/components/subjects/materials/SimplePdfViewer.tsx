/* --------------------------------------------------------------------- */
/*  SimplePdfViewer – načíta uložené AI dáta, generuje len ak chýbajú     */
/*  + manuálna editácia summary a tagov                                  */
/* --------------------------------------------------------------------- */
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Brain,
  Loader2,
  Edit3,
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

  /* AI dáta */
  const [summary, setSummary] = useState<string | null>(null)
  const [tags, setTags]       = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [sumErr, setSumErr]   = useState<string | null>(null)
  const [tagErr, setTagErr]   = useState<string | null>(null)

  /* edit režim */
  const [isEditing, setIsEditing]   = useState(false)
  const [editSummary, setEditSummary] = useState("")
  const [editTags, setEditTags]     = useState("")

  /* reset po zatvorení */
  useEffect(() => {
    if (!isOpen) {
      setSummary(null)
      setTags([])
      setSumErr(null)
      setTagErr(null)
      setAiLoading(false)
      setIsEditing(false)
    }
  }, [isOpen])

  useEffect(() => setPdfTitle(title?.trim() || "Dokument"), [title])

  /* načítaj existujúce AI dáta */
  useEffect(() => {
    if (!isOpen || !token || !materialId) return

    Promise.allSettled([
      fetchMaterialSummary(materialId, token),
      fetchMaterialTags(materialId, token),
    ]).then(results => {
      const [sumRes, tagRes] = results
      if (sumRes.status === "fulfilled") {
        setSummary(sumRes.value.summary)
        setSumErr(sumRes.value.ai_error ?? null)
        if (sumRes.value.summary) onSummaryGenerated?.(materialId, sumRes.value.summary)
      }
      if (tagRes.status === "fulfilled") {
        setTags(tagRes.value)
        if (tagRes.value.length) onTagsGenerated?.(materialId, tagRes.value)
      }
    })
  }, [isOpen, token, materialId, onTagsGenerated, onSummaryGenerated])

  /* pripravi editačné polia */
  useEffect(() => {
    if (isEditing) {
      setEditSummary(summary ?? "")
      setEditTags(tags.join(", "))
    }
  }, [isEditing, summary, tags])

  /* uloženie editu */
  const saveEdits = async () => {
    if (!token) return alert("Chyba autentifikácie.")
    setAiLoading(true)
    setSumErr(null)
    setTagErr(null)
    try {
      const newTags = editTags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)
      await patchMaterial(
        materialId,
        { ai_summary: editSummary, tags: newTags },
        token
      )
      setSummary(editSummary)
      setTags(newTags)
      onSummaryGenerated?.(materialId, editSummary)
      onTagsGenerated?.(materialId, newTags)
      setIsEditing(false)
    } catch (e) {
      const msg = (e as Error).message
      setSumErr(msg)
    } finally {
      setAiLoading(false)
    }
  }

  /* generovanie AI na požiadanie */
  const handleGenerate = async () => {
    if (!token) return alert("Chyba autentifikácie.")
    setAiLoading(true)
    setSumErr(null)
    setTagErr(null)
    try {
      const [s, t] = await Promise.all([
        generateMaterialSummary(materialId, token),
        generateMaterialTags(materialId, token),
      ])
      setSummary(s.summary)
      setSumErr(s.ai_error ?? null)
      setTags(t)
      onSummaryGenerated?.(materialId, s.summary)
      onTagsGenerated?.(materialId, t)
    } catch (e) {
      const msg = (e as Error).message
      if (msg.toLowerCase().includes("tag")) setTagErr(msg)
      else setSumErr(msg)
    } finally {
      setAiLoading(false)
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
            <Button variant="ghost" size="icon" onClick={() => {
              const a = document.createElement("a")
              a.href = blobUrl
              a.download = `${pdfTitle}.pdf`
              a.click()
            }}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.open(blobUrl, "_blank")}>
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">
          {/* PDF */}
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

          {/* SIDE PANEL */}
          <div className="w-full sm:w-72 lg:w-96 border-l p-4 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-semibold">
                <Brain className="h-4 w-4 text-primary" /> AI súhrn
              </h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(e => !e)}
                title={isEditing ? "Zrušiť edit" : "Editovať"}
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              </Button>
            </div>

            {isEditing ? (
              <>
                <Textarea
                  className="mb-2"
                  rows={6}
                  value={editSummary}
                  onChange={e => setEditSummary(e.currentTarget.value)}
                />
                <Input
                  className="mb-2"
                  value={editTags}
                  onChange={e => setEditTags(e.currentTarget.value)}
                  placeholder="tag1, tag2, ..."
                />
                {(sumErr || tagErr) && (
                  <p className="text-sm text-destructive">
                    {sumErr ?? tagErr}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button onClick={saveEdits} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
                    Uložiť
                  </Button>
                  <Button variant="secondary" onClick={handleGenerate} disabled={aiLoading}>
                    <Brain className="h-4 w-4 mr-1" /> Regenerovať
                  </Button>
                </div>
              </>
            ) : (
              <>
                {summary ? (
                  <div className="text-sm space-y-2 whitespace-pre-wrap">
                    {summary.split("\n").map((l, i) => (
                      <p key={i}>{l}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Žiadny súhrn.
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {tags.map(t => (
                    <Badge key={t} variant="outline">#{t}</Badge>
                  ))}
                </div>

                {needAI && (
                  <Button className="mt-2" onClick={handleGenerate} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Brain className="h-4 w-4 mr-1" />}
                    Generovať AI
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
