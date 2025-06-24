"use client";

import { useEffect, useState, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  FileText,
  Download,
  ExternalLink,
  Brain,
  Loader2,
} from "lucide-react";
import { AuthContext } from "@/context/AuthContext";
import {
  fetchMaterialTags,
  generateMaterialSummary,
  generateMaterialTags,
} from "@/services/studyMaterialService";

interface Props {
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
  blobUrl: string | null;
  title?: string;
  materialId: number;
}

export default function SimplePdfViewer({
  blobUrl,
  title,
  isOpen,
  onOpenChange,
  materialId,
}: Props) {
  const { token } = useContext(AuthContext) ?? {};
  const [effTitle, setEffTitle] = useState("Dokument");
  const [iframeLoading, setIframeLoading] = useState(true);

  const [summary, setSummary] = useState<string | null>(null);
  const [sumLoading, setSumLoading] = useState(false);
  const [sumError, setSumError] = useState<string | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);

  // ---------- onOpen -------------
  useEffect(() => {
    if (!isOpen || !token || !materialId) return;
    // načítaj už uložené tagy po otvorení
    fetchMaterialTags(materialId, token)
      .then(setTags)
      .catch(() => {}); // ignoruj chybu – buď ešte nie sú
  }, [isOpen, token, materialId]);

  useEffect(() => setEffTitle(title?.trim() || "Dokument"), [title]);
  useEffect(() => {
    if (!isOpen) {
      setSummary(null);
      setSumError(null);
      setSumLoading(false);
      setTags([]);
      setTagsError(null);
    }
  }, [isOpen]);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = blobUrl ?? "";
    a.download = `${effTitle}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNew = () => window.open(blobUrl ?? "", "_blank");

  const handleGenerateSummary = async () => {
    if (!token) return alert("Chyba autentifikácie.");
    setSumLoading(true);
    setSumError(null);
    setTagsError(null);
    setSummary(null);
    setTags([]);

    try {
      const [summaryRes, tagRes] = await Promise.all([
        generateMaterialSummary(materialId, token),
        generateMaterialTags(materialId, token),
      ]);
      setSummary(summaryRes.summary);
      if (summaryRes.ai_error) setSumError(summaryRes.ai_error);
      setTags(tagRes);
    } catch (e) {
      const err = e as Error;
      if (err.message.includes("sumarizácia")) setSumError(err.message);
      else setTagsError(err.message);
    } finally {
      setSumLoading(false);
    }
  };

  if (!isOpen || !blobUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="flex-row items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="p-2 rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate">{effTitle}</DialogTitle>
              <Badge variant="outline" className="text-xs mt-1">
                PDF Dokument
              </Badge>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleOpenNew}>
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

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative bg-background">
            {iframeLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <iframe
              src={blobUrl}
              className="w-full h-full border-none"
              title={effTitle}
              onLoad={() => setIframeLoading(false)}
            />
          </div>

          <div className="w-full sm:w-72 lg:w-96 border-l p-4 space-y-3 overflow-y-auto">
            <h4 className="flex items-center gap-2 font-semibold">
              <Brain className="h-4 w-4 text-primary" /> AI súhrn
            </h4>

            {/* TAGY */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-muted text-muted-foreground"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
            {tagsError && (
              <p className="text-sm text-destructive">
                Chyba tagov: {tagsError}
              </p>
            )}

            {/* TLAČIDLO */}
            {!summary && !sumError && !sumLoading && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={handleGenerateSummary}
              >
                <Brain className="h-4 w-4 mr-2" /> Generovať súhrn
              </Button>
            )}

            {/* LOADER */}
            {sumLoading && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Generujem…
              </p>
            )}

            {/* CHYBA */}
            {sumError && (
              <p className="text-sm text-destructive">Chyba: {sumError}</p>
            )}

            {/* SUMAR */}
            {summary && !sumError && (
              <div className="text-sm space-y-2">
                {summary
                  .split("\n")
                  .filter((line) => line.startsWith("•"))
                  .map((line, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{line.replace(/^•\s*/, "")}</span>
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

            {!summary && !sumLoading && sumError === null && (
              <p className="text-sm text-muted-foreground italic">
                Súhrn zatiaľ nebol vygenerovaný.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
