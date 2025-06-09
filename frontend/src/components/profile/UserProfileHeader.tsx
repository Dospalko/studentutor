// frontend/src/components/profile/UserProfileHeader.tsx
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProfileHeaderProps {
  fullName: string | null | undefined;
  email: string | undefined;
  initials: string;
}

export default function UserProfileHeader({ fullName, email, initials }: UserProfileHeaderProps) {
  return (
    <CardHeader className="bg-muted/30 dark:bg-muted/20 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-primary/50">
          <AvatarFallback className="text-2xl sm:text-3xl bg-primary/20 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">
            {fullName || "Používateľ"}
          </CardTitle>
          <CardDescription className="text-md text-muted-foreground mt-1">
            {email}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}