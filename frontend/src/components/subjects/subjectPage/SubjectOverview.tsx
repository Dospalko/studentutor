// src/components/subjects/SubjectOverview.tsx
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FC } from "react";
import { Subject } from "@/services/subjectService";

const SubjectOverview: FC<{ subject: Subject }> = ({ subject }) => (
  <Card className="bg-none">
    <CardHeader>
      <CardTitle className="text-3xl md:text-4xl font-bold">
        {subject.name}
      </CardTitle>
      {subject.description && (
        <CardDescription className="text-lg mt-2">
          {subject.description}
        </CardDescription>
      )}
    </CardHeader>
  </Card>
);

export default SubjectOverview;
