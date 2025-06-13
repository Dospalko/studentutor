// src/components/subjects/SubjectHeader.tsx
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC } from "react";

interface Props {
  error?: string | null;
}

const SubjectHeader: FC<Props> = ({ error }) => {
  const router = useRouter();
  return (
    <div className="mb-8 flex justify-between items-center">
      <Button variant="outline" onClick={() => router.push("/dashboard")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Späť na Dashboard
      </Button>

      {error && (
        <Alert variant="destructive" className="ml-4 flex-1">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chyba</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SubjectHeader;
