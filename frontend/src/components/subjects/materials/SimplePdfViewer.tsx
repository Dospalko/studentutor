"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, FileText, Download, ExternalLink, Loader2, Brain } from "lucide-react"

interface SimplePdfViewerProps {
  isOpen: boolean
  onOpenChange: (o: boolean) => void
  blobUrl: string | null
  title?: string
  /* nové ↓ */
  summary?: string | null
  summaryLoading?: boolean
  summaryError?: string | null
}

export default function SimplePdfViewer({
  blobUrl,
  title,
  isOpen,
  onOpenChange,
  summary,
  summaryLoading = false,
  summaryError = null,
}: SimplePdfViewerProps) {
  const [effectiveTitle, setEffectiveTitle] = useState("Dokument")
  const [isLoading, setIsLoading] = useState(true)

  /* --------- title & iframe loading --------- */
  useEffect(() => {
    setEffectiveTitle(title?.trim() || "Dokument")
  }, [title])

  useEffect(() => {
    if (isOpen && blobUrl) {
      setIsLoading(true)
      const t = setTimeout(() => setIsLoading(false), 700) // UX micro-delay
      return () => clearTimeout(t)
    }
  }, [isOpen, blobUrl])

  if (!isOpen || !blobUrl) return null

  /* --------- actions --------- */
  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = `${effectiveTitle}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleOpenInNewTab = () => window.open(blobUrl, "_blank")

  /* --------- render --------- */
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] flex flex-col overflow-hidden border-muted/40 shadow-2xl">
        {/* ---------- HEADER ---------- */}
        <DialogHeader className="flex-row items-center justify-between bg-gradient-to-r from-muted/30 to-muted/10 p-4 border-b border-muted/40">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-lg font-semibold">{effectiveTitle}</DialogTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                PDF Dokument
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              title="Stiahnuť"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenInNewTab}
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              title="Otvoriť v novom okne"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Zavrieť"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* ---------- BODY ---------- */}
        <div className="flex-grow flex flex-col lg:flex-row bg-background overflow-hidden">
          {/* left = pdf */}
          <div className="flex-1 relative bg-background">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            <iframe
              src={blobUrl}
              className="w-full h-full border-none"
              title={effectiveTitle}
              onLoad={() => setIsLoading(false)}
            />
          </div>

          {/* right = AI summary */}
          <aside className="lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-muted/30 p-4 overflow-y-auto">
            <h4 className="flex items-center gap-2 font-semibold text-foreground mb-2">
              <Brain className="h-4 w-4" /> AI súhrn
            </h4>

            {summaryLoading && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generujem súhrn…
              </p>
            )}

            {summaryError && (
              <p className="text-sm text-destructive">{summaryError}</p>
            )}

            {!summaryLoading && !summaryError && summary && (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{summary}</p>
            )}

            {!summaryLoading && !summaryError && !summary && (
              <p className="text-sm text-muted-foreground italic">Súhrn nie je k dispozícii.</p>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
