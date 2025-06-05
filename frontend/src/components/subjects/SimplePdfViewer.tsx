// frontend/src/components/subjects/SimplePdfViewer.tsx
"use client";

import { useEffect, useState } from "react";
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
    if (title && title.trim()) {
      setEffectiveTitle(title);
    }
  }, [title]);

  if (!isOpen || !blobUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl h-[90vh] flex flex-col overflow-hidden rounded-lg shadow-lg">
        <DialogHeader className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 border-b">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-300 flex-shrink-0" />
            <DialogTitle className="truncate text-lg font-medium text-gray-800 dark:text-gray-100">
              {effectiveTitle}
            </DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" title="Zavrieť">
              <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="flex-grow bg-white dark:bg-gray-900">
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
