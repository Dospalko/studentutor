"use client";

import Link from 'next/link';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Settings, UserCircle2, LogIn, UserPlus } from 'lucide-react'; // Použijeme ikony z lucide-react

export default function Navbar() {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  if (!authContext) {
    return ( // Fallback, ak AuthContext ešte nie je dostupný
      <nav className="bg-card text-card-foreground border-b fixed w-full top-0 z-50">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <span className="text-xl font-bold text-primary">TutorAI</span>
          <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
        </div>
      </nav>
    );
  }

  const { user, logout, isLoading: authIsLoading } = authContext;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-card text-card-foreground border-b fixed w-full top-0 z-50 print:hidden"> {/* print:hidden pre skrytie pri tlači */}
      <div className="container mx-auto flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl md:text-2xl font-bold text-primary hover:opacity-80 transition-opacity flex items-center">
          <BookOpen className="h-6 w-6 md:h-7 md:w-7 mr-2" />
          <span>TutorAI</span>
        </Link>
        <div className="flex items-center space-x-2 md:space-x-3">
          {authIsLoading ? (
            <div className="h-9 w-32 bg-muted rounded-md animate-pulse"></div>
          ) : user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex items-center text-muted-foreground hover:text-primary">
                  <Settings className="h-4 w-4 mr-1 md:mr-2"/>
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2 border-l pl-2 md:pl-3">
                <UserCircle2 className="h-6 w-6 text-muted-foreground hidden sm:block"/>
                <span className="text-sm text-muted-foreground hidden md:inline truncate max-w-[150px]">
                  {user.full_name || user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center">
                  <LogOut className="h-4 w-4 sm:mr-2"/>
                  <span className="hidden sm:inline">Odhlásiť</span>
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Prihlásiť sa
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrovať sa
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}