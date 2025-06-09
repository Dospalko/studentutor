// frontend/src/components/profile/UserAccountInfo.tsx
"use client";

import { User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserAccountInfoProps {
  userId: number | undefined;
  fullName: string | null | undefined;
  email: string | undefined;
  isActive: boolean | undefined;
}

export default function UserAccountInfo({ userId, fullName, email, isActive }: UserAccountInfoProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
        <UserIcon className="h-5 w-5 mr-2 text-primary" />
        Informácie o účte
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Celé meno:</span>
          <span className="font-medium text-foreground">{fullName || <span className="italic text-muted-foreground/70">Nezadané</span>}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email:</span>
          <span className="font-medium text-foreground">{email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">ID Používateľa:</span>
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{userId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status účtu:</span>
          <Badge variant={isActive ? "default" : "destructive"} className={`${isActive ? "bg-green-500 hover:bg-green-600 text-primary-foreground" : ""} text-xs`}>
            {isActive ? "Aktívny" : "Neaktívny"}
          </Badge>
        </div>
      </div>
    </div>
  );
}