// frontend/src/app/profile/page.tsx
"use client";

import { useContext, useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthContext, User } from '@/context/AuthContext'; // Pridaj User
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { Subject, getSubjects } from '@/services/subjectService';

import UserProfileHeader from '@/components/profile/UserProfileHeader';
import UserAccountInfo from '@/components/profile/UserAccountInfo';
import UserSubjectsSummary from '@/components/profile/UserSubjectsSummary';
import UserAchievements from '@/components/profile/UserAchievements';
import UserActions from '@/components/profile/UserActions';
import EditProfileDialog from '@/components/profile/EditProfileDialog'; // NOVÝ IMPORT
import UserStats from '@/components/profile/UserStats';
function UserProfilePageContent() {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false); // STAV PRE DIALÓG

  useEffect(() => {
    if (authContext?.token && authContext?.user) {
      setIsLoadingSubjects(true);
      setSubjectsError(null);
      getSubjects(authContext.token)
        .then(data => setSubjects(data.sort((a, b) => a.name.localeCompare(b.name))))
        .catch(err => setSubjectsError((err as Error).message || 'Nepodarilo sa načítať predmety.'))
        .finally(() => setIsLoadingSubjects(false));
    } else if (authContext && !authContext.isLoading && !authContext.user) {
      setIsLoadingSubjects(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authContext?.token, authContext?.user, authContext?.isLoading]);

  if (authContext?.isLoading || !authContext?.user) {
    return (<div className="flex justify-center items-center min-h-[calc(100vh-8rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>);
  }

  const { user, logout, setUser: setAuthUser } = authContext; // Získaj setUser

  const getInitials = (name?: string | null): string => {
    if (!name || name.trim() === "") return "?";
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length === 0 || !nameParts[0]) return "?";
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return ((nameParts[0][0] || "") + (nameParts[nameParts.length - 1][0] || "")).toUpperCase();
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  const handleProfileUpdateSuccess = (updatedUser: User) => {
    if (setAuthUser) {
        setAuthUser(updatedUser); // Aktualizuj usera v AuthContext
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Card className="overflow-hidden shadow-lg">
        <UserProfileHeader 
          fullName={user.full_name}
          email={user.email}
          initials={getInitials(user.full_name)}
        />
        <CardContent className="p-6 sm:p-8 space-y-8">
          <UserAccountInfo 
            userId={user.id}
            fullName={user.full_name}
            email={user.email}
            isActive={user.is_active}
          />
          <Separator />
          <UserSubjectsSummary 
            subjects={subjects}
            isLoading={isLoadingSubjects}
            error={subjectsError}
          />
          <Separator />
          <UserAchievements />
          <Separator />
          <UserActions 
            onLogout={handleLogout} 
            onOpenEditProfile={() => setIsEditProfileDialogOpen(true)}
          />
          <Separator />
          <UserStats/>
        </CardContent>
      </Card>

      {user && (
        <EditProfileDialog
            currentUser={user}
            isOpen={isEditProfileDialogOpen}
            onOpenChange={setIsEditProfileDialogOpen}
            onProfileUpdateSuccess={handleProfileUpdateSuccess}
        />
       )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <UserProfilePageContent />
    </ProtectedRoute>
  );
}