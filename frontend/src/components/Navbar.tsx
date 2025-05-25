// frontend/src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { BookOpenIcon, UserCircleIcon, ArrowLeftStartOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'; // Príklad ikon

export default function Navbar() {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  if (!authContext) return (
    <nav className="bg-white shadow-md text-slate-700 p-4 fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-center items-center">
        <p className="text-sm">Načítavam navigačný panel...</p>
      </div>
    </nav>
  );

  const { user, logout, isLoading } = authContext;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-md text-slate-700 p-3 md:p-4 fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold text-blue-600 hover:text-blue-700 flex items-center">
          <BookOpenIcon className="h-7 w-7 mr-2 text-blue-500" /> {/* Ikona */}
          <span>TutorAI</span>
        </Link>
        <div className="flex items-center space-x-3 md:space-x-4">
          {isLoading ? (
            <div className="h-5 w-20 bg-slate-200 rounded animate-pulse"></div>
          ) : user ? (
            <>
              <Link href="/dashboard" className="text-sm md:text-base hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-blue-50 flex items-center">
                <Cog6ToothIcon className="h-5 w-5 mr-1 md:mr-2"/> {/* Ikona pre Dashboard */}
                Dashboard
              </Link>
              <div className="flex items-center space-x-2">
                <UserCircleIcon className="h-6 w-6 md:h-7 md:w-7 text-slate-500"/>
                <span className="mr-2 md:mr-4 text-sm md:text-base text-slate-600 hidden sm:inline">
                  {user.full_name || user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 md:px-4 rounded-md text-sm md:text-base flex items-center transition-colors"
                title="Odhlásiť sa"
              >
                <ArrowLeftStartOnRectangleIcon className="h-5 w-5 mr-0 sm:mr-2"/>
                <span className="hidden sm:inline">Odhlásiť sa</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm md:text-base text-slate-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-md hover:bg-blue-50">
                Prihlásiť sa
              </Link>
              <Link href="/register" className="text-sm md:text-base bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 md:px-4 rounded-md transition-colors">
                Registrovať sa
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}