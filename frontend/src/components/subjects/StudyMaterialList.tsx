// frontend/src/components/subjects/StudyMaterialList.tsx
"use client";

import { useState, useContext } from 'react';
import { StudyMaterial, fetchProtectedFileAsBlobUrl, downloadProtectedFile } from '@/services/studyMaterialService';
import { AuthContext } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Download, Trash2, AlertCircle, Loader2, Eye } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import SimplePdfViewer from '@/components/subjects/SimplePdfViewer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formatEnumValue = (value: string | undefined | null): string => {
  if (!value || typeof value !== 'string') return 'N/A';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const formatFileSize = (bytes?: number | null): string => {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return 'N/A';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

interface StudyMaterialListProps {
  materials: StudyMaterial[];
  onDeleteMaterial: (materialId: number) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function StudyMaterialList({ materials, onDeleteMaterial, isLoading, error }: StudyMaterialListProps) {
  const [pdfViewerState, setPdfViewerState] = useState<{ blobUrl: string; title: string; fileType: string | null } | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const authContext = useContext(AuthContext);

  const handleDeleteClick = async (materialId: number) => {
    setIsDeleting(materialId);
    try {
      await onDeleteMaterial(materialId);
    } catch {
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewFile = async (material: StudyMaterial) => {
    if (!authContext?.token) {
      alert("Chyba autentifikácie.");
      return;
    }
    if (isProcessingFile === material.id) return;
    setIsProcessingFile(material.id);
    try {
      const { blobUrl, fileType } = await fetchProtectedFileAsBlobUrl(material.id, authContext.token);
      if (fileType && fileType.toLowerCase().includes("pdf")) {
        setPdfViewerState({
          blobUrl: blobUrl,
          title: material.title || material.file_name,
          fileType: fileType,
        });
      } else {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = material.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error("Failed to view/process file:", err);
      alert(`Nepodarilo sa zobraziť/spracovať súbor: ${(err as Error).message}`);
    } finally {
      setIsProcessingFile(null);
    }
  };

  const handleDownloadClick = async (material: StudyMaterial) => {
    if (!authContext?.token) {
      alert("Chyba autentifikácie.");
      return;
    }
    if (isProcessingFile === material.id) return;
    setIsProcessingFile(material.id);
    try {
      await downloadProtectedFile(material.id, material.file_name, authContext.token);
    } catch (err) {
      console.error("Download failed:", err);
      alert(`Nepodarilo sa stiahnuť súbor: ${(err as Error).message}`);
    } finally {
      setIsProcessingFile(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
        Načítavam materiály...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-destructive flex items-center justify-center border border-destructive/50 bg-destructive/10 rounded-md p-4">
        <AlertCircle className="h-5 w-5 mr-2" /> <span className="font-medium">Chyba:</span> {error}
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-md font-medium">Žiadne študijné materiály</p>
        <p className="text-sm">K tomuto predmetu zatiaľ neboli pridané žiadne súbory.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {materials.map(material => (
          <Card key={material.id} className="transition-shadow hover:shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-3">
              <div className="flex items-center gap-3 flex-grow min-w-0">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-primary flex-shrink-0" />
                <div className="flex-grow overflow-hidden">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h4
                        className={`text-sm sm:text-md font-semibold truncate ${material.file_type && material.file_type.toLowerCase().includes("pdf") ? 'hover:underline cursor-pointer text-primary dark:text-primary-foreground/90' : 'text-foreground'}`}
                        onClick={() => handleViewFile(material)}
                        title={material.title || material.file_name}
                      >
                        {material.title || material.file_name}
                      </h4>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{material.title || material.file_name}</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 mt-0.5">
                    <span>{formatFileSize(material.file_size)}</span>
                    {material.material_type && (
                      <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
                        {formatEnumValue(material.material_type)}
                      </Badge>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          Nahrané: {new Date(material.uploaded_at).toLocaleDateString('sk-SK')}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {new Date(material.uploaded_at).toLocaleString('sk-SK', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          })}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {material.description && (
                    <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2" title={material.description}>
                      {material.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 mt-2 sm:mt-0 flex-shrink-0 self-start sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewFile(material)}
                  disabled={isProcessingFile === material.id}
                  title={material.file_type && material.file_type.toLowerCase().includes("pdf") ? "Zobraziť PDF" : "Otvoriť súbor"}
                >
                  {isProcessingFile === material.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="mr-0 sm:mr-1.5 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {material.file_type && material.file_type.toLowerCase().includes("pdf") ? "Zobraziť" : "Otvoriť"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadClick(material)}
                  disabled={isProcessingFile === material.id}
                  title="Stiahnuť súbor"
                >
                  {isProcessingFile === material.id ? (
                    <Loader2 className="mr-0 sm:mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-0 sm:mr-1.5 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Stiahnuť</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(material.id)}
                  disabled={isDeleting === material.id}
                  title="Zmazať materiál"
                >
                  {isDeleting === material.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-0 sm:mr-1.5 h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{isDeleting === material.id ? "" : "Zmazať"}</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SimplePdfViewer
        isOpen={!!pdfViewerState}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPdfViewerState(null);
        }}
        blobUrl={pdfViewerState?.blobUrl || null}
        title={pdfViewerState?.title}
      />
    </TooltipProvider>
  );
}
