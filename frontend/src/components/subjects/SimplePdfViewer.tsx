// frontend/src/components/subjects/SimplePdfViewer.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, FileText } from "lucide-react";

interface SimplePdfViewerProps {
  blobUrl: string | null;
  title?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SimplePdfViewer({
  blobUrl,
  title,
  isOpen,
  onOpenChange,
}: SimplePdfViewerProps) {
  const [effectiveTitle, setEffectiveTitle] = useState("Dokument");

  useEffect(() => {
    if (title) setEffectiveTitle(title);
  }, [title]);

  if (!isOpen || !blobUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[85vh] md:h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <DialogTitle className="truncate text-lg">
              {effectiveTitle}
            </DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" title="Zavrieť">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          <iframe
            src={blobUrl}
            className="w-full h-full border-none"
            title={effectiveTitle}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
