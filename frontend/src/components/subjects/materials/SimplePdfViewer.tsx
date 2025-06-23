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
import { X, FileText, Download, ExternalLink } from 'lucide-react'

interface SimplePdfViewerProps {
  isOpen: boolean
  onOpenChange: (o: boolean) => void
  blobUrl: string | null
  title?: string
  /* nové: */
  summary?: string | null
  summaryLoading?: boolean
  summaryError?: string | null
}

export default function SimplePdfViewer({
  blobUrl,
  title,
  isOpen,
  onOpenChange,
}: SimplePdfViewerProps) {
  const [effectiveTitle, setEffectiveTitle] = useState("Dokument")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (title && title.trim()) {
      setEffectiveTitle(title)
    }
  }, [title])

  useEffect(() => {
    if (isOpen && blobUrl) {
      setIsLoading(true)
      // Simulate loading time for better UX
      const timer = setTimeout(() => setIsLoading(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, blobUrl])

  if (!isOpen || !blobUrl) return null

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = blobUrl
    link.download = `${effectiveTitle}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenInNewTab = () => {
    window.open(blobUrl, "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] flex flex-col overflow-hidden border-muted/40 shadow-2xl">
        <DialogHeader className="flex-row items-center justify-between bg-gradient-to-r from-muted/30 to-muted/10 p-4 border-b border-muted/40 rounded-t-lg">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate text-lg font-semibold text-foreground">
                {effectiveTitle}
              </DialogTitle>
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

        <div className="flex-grow relative bg-background overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p className="text-sm text-muted-foreground">Načítavam dokument...</p>
              </div>
            </div>
          )}
          
          <iframe
            src={blobUrl}
            className="w-full h-full border-none rounded-b-lg"
            title={effectiveTitle}
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}