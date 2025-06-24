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
  fetchMaterialSummary,
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

  /* UI state ------------------------------------------------------------ */
  const [effTitle, setEffTitle] = useState("Dokument");
  const [iframeLoading, setIframeLoading] = useState(true);

  /* AI – summary -------------------------------------------------------- */
  const [summary, setSummary] = useState<string | null>(null);
  const [sumLoading, setSumLoading] = useState(false);
  const [sumError, setSumError] = useState<string | null>(null);

  /* AI – tags ----------------------------------------------------------- */
  const [tags, setTags] = useState<string[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);

  /* -------------------------------------------------------------------- */

  /* reset pri zatvorení ------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) {
      setSummary(null);
      setSumError(null);
      setTags([]);
      setTagsError(null);
      setSumLoading(false);
    }
  }, [isOpen]);

  /* aktualizuj zobrazený titul ------------------------------------------ */
  useEffect(() => setEffTitle(title?.trim() || "Dokument"), [title]);

  /* po otvorení dialógu – skús načítať kešované AI dáta ------------------ */
  useEffect(() => {
    if (!isOpen || !token || !materialId) return;

    fetchMaterialSummary(materialId, token)
      .then((s) => {
        setSummary(s.summary);
        setSumError(s.ai_error ?? null);
      })
      .catch(() => {});

    fetchMaterialTags(materialId, token)
      .then(setTags)
      .catch(() => {});
  }, [isOpen, token, materialId]);

  /* -------------------------------------------------------------------- */
  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${effTitle}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNew = () => blobUrl && window.open(blobUrl, "_blank");

  /* klik na AI tlačidlo ------------------------------------------------- */
  const handleGenerateAI = async () => {
    if (!token) return alert("Chyba autentifikácie.");
    setSumLoading(true);
    setSumError(null);
    setTagsError(null);

    try {
      const [sumRes, tagRes] = await Promise.all([
        generateMaterialSummary(materialId, token),
        generateMaterialTags(materialId, token),
      ]);
      setSummary(sumRes.summary);
      if (sumRes.ai_error) setSumError(sumRes.ai_error);
      setTags(tagRes);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("sumarizácia")) setSumError(msg);
      else setTagsError(msg);
    } finally {
      setSumLoading(false);
    }
  };

  /* -------------------------------------------------------------------- */
  if (!isOpen || !blobUrl) return null;

  const needAI = (!summary || !!sumError) || tags.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl h-[95vh] p-0 overflow-hidden flex flex-col">
        {/* ---------------- HEADER ---------------- */}
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
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* ---------------- BODY ------------------ */}
        <div className="flex flex-1 overflow-hidden">
          {/* ----- PDF iframe ----- */}
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

          {/* ----- SIDE PANE ----- */}
          <div className="w-full sm:w-72 lg:w-96 border-l p-4 space-y-3 overflow-y-auto">
            <h4 className="flex items-center gap-2 font-semibold">
              <Brain className="h-4 w-4 text-primary" /> AI súhrn
            </h4>

            {/* TAGY ------------------------------------------------------- */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {tags.map((t) => (
                  <Badge key={t} variant="outline" className="bg-muted text-muted-foreground">
                    #{t}
                  </Badge>
                ))}
              </div>
            )}
            {tagsError && <p className="text-sm text-destructive">Chyba tagov: {tagsError}</p>}

            {/* AI TLAČIDLO ------------------------------------------------ */}
            {needAI && !sumLoading && (
              <Button variant="secondary" size="sm" onClick={handleGenerateAI}>
                <Brain className="h-4 w-4 mr-2" /> Generovať AI
              </Button>
            )}

            {/* LOADER ---------------------------------------------------- */}
            {sumLoading && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Generujem…
              </p>
            )}

            {/* CHYBA ----------------------------------------------------- */}
            {sumError && <p className="text-sm text-destructive">Chyba: {sumError}</p>}

            {/* SUMAR ----------------------------------------------------- */}
            {summary && !sumError && (
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
                    <h5 className="font-semibold mb-1">Sumarizácia:</h5>
                    <p className="whitespace-pre-wrap">
                      {summary.split("Sumarizácia:")[1].trim()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!summary && !sumLoading && !sumError && (
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
