// frontend/src/components/common/PdfViewerDialog.tsx (alebo podobná cesta)
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose, // Ak chceš explicitné tlačidlo na zatvorenie
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X,Maximize, Minimize } from "lucide-react";
import { useState } from "react";

interface PdfViewerDialogProps {
  pdfUrl: string | null; // URL k PDF súboru
  title?: string; // Názov súboru alebo materiálu
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function PdfViewerDialog({
  pdfUrl,
  title,
  isOpen,
  onOpenChange,
}: PdfViewerDialogProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!isOpen || !pdfUrl) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          ${isFullScreen 
            ? 'fixed inset-0 w-full h-full max-w-full max-h-full p-0 sm:p-0 md:p-0 lg:p-0 rounded-none border-none' 
            : 'sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[80vh] md:h-[85vh] lg:h-[90vh]'} 
          flex flex-col overflow-hidden transition-all duration-300 ease-in-out
        `}
        onInteractOutside={(e) => {
          // Zabráni zatvoreniu, ak klikáme na iframe (niektoré prehliadače to môžu vyžadovať)
          if ((e.target as HTMLElement)?.closest('iframe')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className={`p-4 border-b ${isFullScreen ? 'bg-background' : ''} flex flex-row items-center justify-between shrink-0`}>
          <DialogTitle className="truncate text-lg">{title || "PDF Prehliadač"}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)} title={isFullScreen ? "Minimalizovať" : "Maximalizovať"}>
              {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" title="Zavrieť">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="flex-grow p-0 m-0 h-full w-full">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`} // Parametre pre PDF viewer
            title={title || "PDF Dokument"}
            className="w-full h-full border-0"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // Bezpečnostné atribúty
          />
          {/* Alternatíva s <embed>
          <embed
            src={pdfUrl}
            type="application/pdf"
            className="w-full h-full border-0"
          />
          */}
        </div>
      </DialogContent>
    </Dialog>
  );
}