// frontend/src/app/profile/page.tsx
"use client";

import { useContext } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute'; // Uisti sa, že cesta je správna
import { AuthContext } from '@/context/AuthContext'; // Uisti sa, že cesta je správna
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Pre zobrazenie iniciálok
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Edit, KeyRound,Loader2, BarChartHorizontalBig, LogOut, ShieldCheck, LayoutGrid } from "lucide-react"; // Ikony
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Pre odhlásenie

function UserProfilePageContent() {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  if (authContext?.isLoading || !authContext?.user) {
    // Zobraz loading, kým sa načítavajú dáta používateľa, alebo ak user nie je definovaný
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const { user, logout } = authContext;

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || "";
    return (names[0][0] || "") + (names[names.length - 1][0] || "").toUpperCase();
  };

  const handleLogout = () => {
    logout();
    router.push('/login'); // Presmeruj na login po odhlásení
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-muted/30 dark:bg-muted/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-primary/50">
              {/* TODO: Placeholder pre obrázok avatara, ak by sme ho mali */}
              {/* <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} /> */}
              <AvatarFallback className="text-2xl sm:text-3xl bg-primary/20 text-primary font-semibold">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">
                {user.full_name || "Používateľ"}
              </CardTitle>
              <CardDescription className="text-md text-muted-foreground mt-1">
                {user.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-primary" />
              Informácie o účte
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Celé meno:</span>
                <span className="font-medium text-foreground">{user.full_name || <span className="italic text-muted-foreground/70">Nezadané</span>}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID Používateľa:</span>
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{user.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status účtu:</span>
                <Badge variant={user.is_active ? "default" : "destructive"} className={user.is_active ? "bg-green-500 hover:bg-green-600" : ""}>
                  {user.is_active ? "Aktívny" : "Neaktívny"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
              Nastavenia a Akcie
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* TODO: Odkazy na budúce funkcie */}
              <Button variant="outline" disabled className="justify-start text-muted-foreground">
                <Edit className="h-4 w-4 mr-2" /> Upraviť Profil (čoskoro)
              </Button>
              <Button variant="outline" disabled className="justify-start text-muted-foreground">
                <KeyRound className="h-4 w-4 mr-2" /> Zmeniť Heslo (čoskoro)
              </Button>
              <Button variant="outline" disabled className="justify-start text-muted-foreground">
                <BarChartHorizontalBig className="h-4 w-4 mr-2" /> Moje Štatistiky (čoskoro)
              </Button>
              {/* Odkaz na dashboard */}
              <Link href="/dashboard" passHref legacyBehavior>
                <Button variant="outline" className="justify-start w-full">
                  <LayoutGrid className="h-4 w-4 mr-2" /> Dashboard
                </Button>
              </Link>
            </div>
          </div>

          <Separator />
          
          <div className="mt-6 flex justify-end">
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Odhlásiť sa
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}


// Hlavný export stránky
export default function ProfilePage() {
  return (
    <ProtectedRoute> {/* Ochrana routy - len pre prihlásených */}
      <UserProfilePageContent />
    </ProtectedRoute>
  );
}