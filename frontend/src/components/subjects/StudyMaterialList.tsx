// frontend/src/components/subjects/StudyMaterialList.tsx
"use client";

import { useState } from 'react';
import { StudyMaterial, getStudyMaterialDownloadUrl } from '@/services/studyMaterialService';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card"; // CardHeader, CardContent atď. tu nie sú priamo použité pre každý item
import { FileText, Download, Trash2, AlertCircle, Loader2, Eye } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import PdfViewerDialog from '@/components/subjects/PdfViewerDialog'; // Predpokladáme, že je v components/common
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


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
  const [pdfToView, setPdfToView] = useState<{ url: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null); // ID materiálu, ktorý sa práve maže

  const handleDeleteClick = async (materialId: number) => {
    setIsDeleting(materialId);
    try {
      await onDeleteMaterial(materialId);
    } catch {
      // Chyba sa spracuje v rodičovskom komponente
      
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
        <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2"/>
            Načítavam materiály...
        </div>
    );
  }

  if (error) {
    return (
        <div className="py-4 text-destructive flex items-center justify-center border border-destructive/50 bg-destructive/10 rounded-md p-4">
            <AlertCircle className="h-5 w-5 mr-2"/> 
            <span className="font-medium">Chyba:</span> {error}
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

  const handleViewPdf = (material: StudyMaterial) => {
    // Zobrazujeme PDF len ak je to naozaj PDF
    if (material.file_type === "application/pdf") {
      setPdfToView({
        url: getStudyMaterialDownloadUrl(material.id),
        title: material.title || material.file_name,
      });
    } else {
      // Pre ostatné typy otvoríme v novom okne (prehliadač sa pokúsi stiahnuť alebo zobraziť)
      window.open(getStudyMaterialDownloadUrl(material.id), '_blank');
    }
  };

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
                        className={`text-sm sm:text-md font-semibold truncate ${material.file_type === "application/pdf" ? 'hover:underline cursor-pointer text-primary dark:text-primary-foreground/90' : 'text-foreground'}`} 
                        onClick={() => handleViewPdf(material)}
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
                    {material.material_type && <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">{formatEnumValue(material.material_type)}</Badge>}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>Nahrané: {new Date(material.uploaded_at).toLocaleDateString('sk-SK')}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{new Date(material.uploaded_at).toLocaleString('sk-SK', { dateStyle: 'long', timeStyle: 'short'})}</p>
                        </TooltipContent>
                    </Tooltip>
                  </div>
                  {material.description && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2" title={material.description}>{material.description}</p>}
                </div>
              </div>
              <div className="flex space-x-2 mt-2 sm:mt-0 flex-shrink-0 self-start sm:self-center">
                {material.file_type === "application/pdf" && (
                  <Button variant="outline" size="sm" onClick={() => handleViewPdf(material)} title="Zobraziť PDF v prehliadači">
                    <Eye className="mr-0 sm:mr-1.5 h-4 w-4" /> <span className="hidden sm:inline">Zobraziť</span>
                  </Button>
                )}
                <a href={getStudyMaterialDownloadUrl(material.id)} target="_blank" rel="noopener noreferrer" download={material.file_name}>
                  <Button variant="outline" size="sm" title="Stiahnuť súbor">
                    <Download className="mr-0 sm:mr-1.5 h-4 w-4" /> <span className="hidden sm:inline">Stiahnuť</span>
                  </Button>
                </a>
                <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteClick(material.id)} 
                    disabled={isDeleting === material.id}
                    title="Zmazať materiál"
                >
                  {isDeleting === material.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="mr-0 sm:mr-1.5 h-4 w-4" />}
                  <span className="hidden sm:inline">{isDeleting === material.id ? "" : "Zmazať"}</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PdfViewerDialog
        isOpen={!!pdfToView}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPdfToView(null);
        }}
        pdfUrl={pdfToView?.url || null}
        title={pdfToView?.title}
      />
    </TooltipProvider>
  );
}