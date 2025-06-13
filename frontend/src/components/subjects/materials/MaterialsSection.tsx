// src/components/subjects/MaterialsSection.tsx
"use client";
import { FC } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import StudyMaterialUploadForm from "@/components/subjects/materials/StudyMaterialUploadForm";
import StudyMaterialList from "@/components/subjects/materials/StudyMaterialList";
import { StudyMaterial } from "@/services/studyMaterialService";

interface Props {
  subjectId: number;
  token: string | null;
  materials: StudyMaterial[];
  isLoading: boolean;
  error: string | null;
  onUpload: (m: StudyMaterial) => void;
  onDelete: (id: number) => Promise<void>;
}

const MaterialsSection: FC<Props> = ({
  subjectId,
  token,
  materials,
  isLoading,
  error,
  onUpload,
  onDelete,
}) => (
  <Card className="mt-8">
    <CardHeader>
      <div className="flex items-center">
        <FileText className="mr-2 h-6 w-6 text-primary" />
        <CardTitle className="text-2xl">Materiály k predmetu</CardTitle>
      </div>
      <CardDescription>Nahraj PDF, prezentácie či poznámky.</CardDescription>
    </CardHeader>

    <CardContent className="space-y-6">
      <StudyMaterialUploadForm
        subjectId={subjectId}
        token={token}
        onUploadSuccess={onUpload}
      />

      <StudyMaterialList
        materials={materials}
        isLoading={isLoading}
        error={error}
        onDeleteMaterial={onDelete}
      />
    </CardContent>
  </Card>
);

export default MaterialsSection;
