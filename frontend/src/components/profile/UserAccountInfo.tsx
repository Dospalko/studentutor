"use client"

import { UserIcon, Mail, Hash, Shield, CheckCircle, XCircle } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface UserAccountInfoProps {
  userId: number | undefined
  fullName: string | null | undefined
  email: string | undefined
  isActive: boolean | undefined
}

const InfoRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <div className="text-right">{children}</div>
  </div>
)

export default function UserAccountInfo({ userId, fullName, email, isActive }: UserAccountInfoProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
          <UserIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Informácie o účte</h3>
          <p className="text-sm text-muted-foreground">Vaše osobné údaje a nastavenia</p>
        </div>
      </div>

      {/* Account Details */}
      <div className="space-y-3">
        <InfoRow icon={<UserIcon className="h-4 w-4 text-blue-600" />} label="Celé meno">
          <span className="font-medium text-foreground">
            {fullName || (
              <span className="italic text-muted-foreground/70 text-sm">Nezadané</span>
            )}
          </span>
        </InfoRow>

        <InfoRow icon={<Mail className="h-4 w-4 text-green-600" />} label="Email">
          <span className="font-medium text-foreground">{email}</span>
        </InfoRow>

        <InfoRow icon={<Hash className="h-4 w-4 text-purple-600" />} label="ID Používateľa">
          <Badge variant="outline" className="font-mono text-xs">
            #{userId}
          </Badge>
        </InfoRow>

        <InfoRow icon={<Shield className="h-4 w-4 text-amber-600" />} label="Status účtu">
          <Badge
            variant={isActive ? "default" : "destructive"}
            className={`flex items-center gap-1 ${
              isActive
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {isActive ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {isActive ? "Aktívny" : "Neaktívny"}
          </Badge>
        </InfoRow>
      </div>

      {/* Account Health Indicator */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">Účet je v poriadku</p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Všetky údaje sú kompletné a účet je aktívny
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
