// frontend/src/components/ProtectedRoute.tsx
"use client";

import { useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const authContext = useContext(AuthContext);
  const router = useRouter();
  
  // Extract values with fallbacks for when authContext is null
  const isLoading = authContext?.isLoading ?? true;
  const token = authContext?.token;
  
  useEffect(() => {
    if (!authContext) {
      console.error("AuthContext not found in ProtectedRoute");
      router.push('/login'); // Fallback presmerovanie
    }
  }, [authContext, router]);

  useEffect(() => {
    if (!isLoading && !token) { // Ak sa nenačítava a nie je token (teda ani user)
      router.push('/login');
    }
  }, [isLoading, token, router]);
  
  if (!authContext) {
    return <div className="flex justify-center items-center min-h-screen">Načítavam kontext...</div>;
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Načítavam dáta používateľa...</div>; // Alebo nejaký spinner
  }

  if (!token) {
    // Tento return by sa teoreticky nemal vykonať kvôli useEffect, ale pre istotu
    return null; // Alebo presmerovanie, ak useEffect ešte neprebehol
  }

  // Ak je používateľ prihlásený (má token) a nenačítavajú sa dáta, zobrazí children
  return <>{children}</>;
};

export default ProtectedRoute;