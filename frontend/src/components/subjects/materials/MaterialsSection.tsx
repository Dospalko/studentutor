"use client"

import type { FC } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Sparkles, FolderOpen } from "lucide-react"
import StudyMaterialUploadForm from "@/components/subjects/materials/StudyMaterialUploadForm"
import StudyMaterialList from "@/components/subjects/materials/StudyMaterialList"
import type { StudyMaterial } from "@/services/studyMaterialService"

interface Props {
  subjectId: number
  token: string | null
  materials: StudyMaterial[]
  isLoading: boolean
  error: string | null
  onUpload: (m: StudyMaterial) => void
  onDelete: (id: number) => Promise<void>
}

const MaterialsSection: FC<Props> = ({ subjectId, token, materials, isLoading, error, onUpload, onDelete }) => (
  <div className="space-y-8">
    {/* Enhanced Header */}
    <Card className=" bg-gradient-to-r from-primary/5 to-secondary/5 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl opacity-60" />

      <CardHeader className="relative z-10 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 shadow-lg">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Študijné Materiály
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground mt-1">
                Centralizované úložisko pre všetky vaše materiály
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-2 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
              <FolderOpen className="h-3 w-3" />
              {materials.length} materiálov
            </Badge>
            <Badge variant="outline" className="gap-2 bg-white/50 dark:bg-black/50 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              AI analýza
            </Badge>
          </div>
        </div>
      </CardHeader>
    </Card>

    {/* Upload Form */}
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <StudyMaterialUploadForm subjectId={subjectId} token={token} onUploadSuccess={onUpload} />
    </div>

    {/* Materials List */}
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <StudyMaterialList materials={materials} isLoading={isLoading} error={error} onDeleteMaterial={onDelete} />
    </div>
  </div>
)

export default MaterialsSection
