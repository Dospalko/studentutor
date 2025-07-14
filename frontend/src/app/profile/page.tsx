"use client"

import { useContext, useEffect, useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import { AuthContext, type User } from "@/context/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, UserIcon, Sparkles } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { type Subject, getSubjects } from "@/services/subjectService"
import UserProfileHeader from "@/components/profile/UserProfileHeader"
import UserAccountInfo from "@/components/profile/UserAccountInfo"
import UserSubjectsSummary from "@/components/profile/UserSubjectsSummary"
import UserAchievements from "@/components/profile/UserAchievements"
import UserActions from "@/components/profile/UserActions"
import EditProfileDialog from "@/components/profile/EditProfileDialog"
import UserStats from "@/components/profile/UserStats"

function UserProfilePageContent() {
  const authContext = useContext(AuthContext)
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [subjectsError, setSubjectsError] = useState<string | null>(null)
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false)

  useEffect(() => {
    if (authContext?.token && authContext.user) {
      setIsLoadingSubjects(true)
      setSubjectsError(null)
      getSubjects(authContext.token)
        .then((data) => setSubjects(data.sort((a, b) => a.name.localeCompare(b.name))))
        .catch((err) => setSubjectsError((err as Error).message || "Nepodarilo sa načítať predmety."))
        .finally(() => setIsLoadingSubjects(false))
    } else if (authContext && !authContext.user) {
      setIsLoadingSubjects(false)
    }
  }, [authContext])

  if (authContext?.isLoading || !authContext?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Načítavam profil...</p>
          </div>
        </div>
      </div>
    )
  }

  const { user, logout, setUser: setAuthUser } = authContext

  const getInitials = (name?: string | null): string => {
    if (!name || name.trim() === "") return "?"
    const nameParts = name.trim().split(/\s+/)
    if (nameParts.length === 0 || !nameParts[0]) return "?"
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase()
    return ((nameParts[0][0] || "") + (nameParts[nameParts.length - 1][0] || "")).toUpperCase()
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleProfileUpdateSuccess = (updatedUser: User) => {
    if (setAuthUser) {
      setAuthUser(updatedUser)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Môj Profil
              </h1>
              <p className="text-muted-foreground">Spravujte svoj účet a sledujte pokrok</p>
            </div>
          </div>
        </div>

        {/* Main Profile Card */}
        <Card className="overflow-hidden shadow-xl border-primary/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <UserProfileHeader fullName={user.full_name} email={user.email} initials={getInitials(user.full_name)} />

          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Account Info */}
            <UserAccountInfo userId={user.id} fullName={user.full_name} email={user.email} isActive={user.is_active} />

            <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Stats Section */}
            <UserStats />

            <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Subjects Summary */}
            <UserSubjectsSummary subjects={subjects} isLoading={isLoadingSubjects} error={subjectsError} />

            <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Achievements */}
            <UserAchievements />

            <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Actions */}
            <UserActions onLogout={handleLogout} onOpenEditProfile={() => setIsEditProfileDialogOpen(true)} />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Ďakujeme, že používate našu aplikáciu!
          </p>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {user && (
        <EditProfileDialog
          currentUser={user}
          isOpen={isEditProfileDialogOpen}
          onOpenChange={setIsEditProfileDialogOpen}
          onProfileUpdateSuccess={handleProfileUpdateSuccess}
        />
      )}
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <UserProfilePageContent />
    </ProtectedRoute>
  )
}
