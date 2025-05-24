// frontend/src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  if (!authContext) return null; // Alebo nejaký fallback UI

  const { user, logout, isLoading } = authContext;

  const handleLogout = () => {
    logout();
    router.push('/login'); // Presmeruj na login po odhlásení
  };

  return (
    <nav className="bg-gray-800 text-white p-4 fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Personalizovaný Tutor
        </Link>
        <div>
          {isLoading ? (
            <p>Načítavam...</p>
          ) : user ? (
            <>
              <span className="mr-4">Vitaj, {user.full_name || user.email}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Odhlásiť sa
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="mr-4 hover:text-gray-300">
                Login
              </Link>
              <Link href="/register" className="hover:text-gray-300">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}