/* --------------------------------------------------------------------- */
/*  SimplePdfViewer – načíta uložené AI dáta, generuje len ak chýbajú     */
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
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Brain,
  Loader2,
} from "lucide-react"
import { AuthContext } from "@/context/AuthContext"
import {
  fetchMaterialSummary,
  fetchMaterialTags,
  generateMaterialSummary,
  generateMaterialTags,
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

  /* AI */
  const [summary, setSummary] = useState<string | null>(null)
  const [tags, setTags]       = useState<string[]>([])
  const [aiLoading, setLoading] = useState(false)
  const [sumErr, setSumErr]   = useState<string | null>(null)
  const [tagErr, setTagErr]   = useState<string | null>(null)

  /* reset po zatvorení */
  useEffect(() => {
    if (!isOpen) {
      setSummary(null); setTags([])
      setSumErr(null); setTagErr(null)
      setLoading(false)
    }
  }, [isOpen])

  useEffect(() => setPdfTitle(title?.trim() || "Dokument"), [title])

  /* ––– načítaj existujúce AI dáta po otvorení ––– */
  useEffect(() => {
    if (!isOpen || !token || !materialId) return

    /* paralelne GET-e bez force */
    Promise.allSettled([
      fetchMaterialSummary(materialId, token),
      fetchMaterialTags(materialId, token),
    ]).then(res => {
      const sumRes = res[0].status === "fulfilled" ? res[0].value : undefined
      const tagRes = res[1].status === "fulfilled" ? res[1].value : undefined

      if (sumRes) {
        setSummary(sumRes.summary)
        setSumErr(sumRes.ai_error ?? null)
        if (sumRes.summary) onSummaryGenerated?.(materialId, sumRes.summary)
      }
      if (tagRes) {
        setTags(tagRes)
        if (tagRes.length) onTagsGenerated?.(materialId, tagRes)
      }
    })
  }, [isOpen, token, materialId, onTagsGenerated, onSummaryGenerated])

  /* ––– voliteľné generovanie ––– */
  const handleGenerate = async () => {
    if (!token) return alert("Chyba autentifikácie.")
    setLoading(true); setSumErr(null); setTagErr(null)
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
      if (msg.includes("tag")) setTagErr(msg)
      else setSumErr(msg)
    } finally {
      setLoading(false)
    }
  }

  const needAI = (!summary && !sumErr) || tags.length === 0

  /* ------------------------------------------------------------------- */
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
            <h4 className="flex items-center gap-2 font-semibold">
              <Brain className="h-4 w-4 text-primary" /> AI súhrn
            </h4>

            {/* TAGY */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {tags.map(t => (
                  <Badge key={t} variant="outline" className="bg-muted text-muted-foreground">
                    #{t}
                  </Badge>
                ))}
              </div>
            )}
            {tagErr && <p className="text-sm text-destructive">Chyba tagov: {tagErr}</p>}

            {/* AI BUTTON */}
            {needAI && !aiLoading && (
              <Button variant="secondary" size="sm" onClick={handleGenerate}>
                <Brain className="h-4 w-4 mr-2" /> Generovať AI
              </Button>
            )}

            {aiLoading && (
              <p className="text-sm flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Generujem…
              </p>
            )}

            {sumErr && <p className="text-sm text-destructive">Chyba: {sumErr}</p>}

            {summary && !sumErr && (
              <div className="text-sm space-y-2">
                {summary
                  .split("\n")
                  .filter(l => l.trim().startsWith("•"))
                  .map((l, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{l.replace(/^•\s*/, "")}</span>
                    </div>
                  ))}

                {summary.includes("Sumarizácia:") && (
                  <div className="pt-3 border-t text-muted-foreground">
                    <h5 className="font-semibold mb-1">Sumarizácia:</h5>
                    <p className="whitespace-pre-wrap">
                      {summary.split("Sumarizácia:")[1].trim()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!summary && !aiLoading && !sumErr && (
              <p className="text-sm text-muted-foreground italic">
                Súhrn zatiaľ nebol vygenerovaný.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
