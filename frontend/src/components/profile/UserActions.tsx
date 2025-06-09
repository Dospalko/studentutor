"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, KeyRound, BarChartHorizontalBig, LogOut, ShieldCheck, LayoutGrid } from "lucide-react";

interface UserActionsProps {
  onLogout: () => void;
  onOpenEditProfile: () => void;
}

export default function UserActions({ onLogout, onOpenEditProfile }: UserActionsProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
        Nastavenia a Akcie
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button variant="outline" onClick={onOpenEditProfile} className="justify-start">
          <Edit className="h-4 w-4 mr-2" /> Upraviť Profil
        </Button>
        <Button variant="outline" disabled className="justify-start text-muted-foreground">
          <KeyRound className="h-4 w-4 mr-2" /> Zmeniť Heslo (čoskoro)
        </Button>
        <Button variant="outline" disabled className="justify-start text-muted-foreground">
          <BarChartHorizontalBig className="h-4 w-4 mr-2" /> Moje Štatistiky (čoskoro)
        </Button>
        <Link href="/dashboard" passHref>
          <Button variant="outline" className="justify-start w-full">
            <LayoutGrid className="h-4 w-4 mr-2" /> Dashboard
          </Button>
        </Link>
      </div>
      <div className="mt-6 pt-6 border-t flex justify-end">
        <Button variant="destructive" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Odhlásiť sa
        </Button>
      </div>
    </div>
  );
}