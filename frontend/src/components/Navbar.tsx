// frontend/src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  if (!authContext) return <nav className="bg-gray-800 text-white p-4 fixed w-full top-0 z-50">Načítavam...</nav>;

  const { user, logout, isLoading } = authContext;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-gray-800 text-white p-4 fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:text-gray-300">
          Personalizovaný Tutor
        </Link>
        <div className="flex items-center">
          {isLoading ? (
            <p className="text-sm">Načítavam...</p>
          ) : user ? (
            <>
              {/* Odkaz na Dashboard */}
              <Link href="/dashboard" className="mr-4 hover:text-gray-300">
                Dashboard
              </Link>
              <span className="mr-4 text-sm">Vitaj, {user.full_name || user.email}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
              >
                Odhlásiť sa
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="mr-4 hover:text-gray-300">
                Login
              </Link>
              <Link href="/register" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}