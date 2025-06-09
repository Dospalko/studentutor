// frontend/src/context/AuthContext.tsx
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react'; // Pridaný useCallback

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User { // Exportuj User typ, aby ho mohli používať aj iné komponenty
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  // Ak by si v budúcnosti pridával napr. rolu alebo iné info, pridaj ich sem
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (newToken: string) => void;
  logout: () => void;
  fetchUser: (currentToken?: string) => Promise<void>; // Upravený typ pre currentToken
  setUser: React.Dispatch<React.SetStateAction<User | null>>; // <<<< NOVÝ PROP PRE SETTER
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // setUser je tu definovaný
  const [isLoading, setIsLoading] = useState(true);

  // Funkcia logout musí byť definovaná pred fetchUser, ak ju fetchUser volá
  const performLogout = useCallback(() => { // useCallback, aby sa nemenila referencia zbytočne
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    // Optional: redirect to login page if not already handled by ProtectedRoute or similar
    // napr. if (typeof window !== 'undefined') window.location.href = '/login';
    // Ale toto je lepšie riešiť cez Next.js router v komponentoch.
  }, []);


  const fetchUser = useCallback(async (currentToken?: string) => {
    const tokenToUse = currentToken || token;
    if (!tokenToUse) {
      setUser(null); // Ak nie je token, nastav usera na null
      setIsLoading(false);
      return;
    }

    setIsLoading(true); // Nastav loading pred fetchom
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        console.error('Failed to fetch user, token might be invalid. Status:', response.status);
        performLogout(); // Použi stabilnú referenciu na logout
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      performLogout(); // Pri akejkoľvek chybe odhlás
    } finally {
      setIsLoading(false);
    }
  }, [token, performLogout]); // Závislosti pre useCallback


  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken); // Nastav token zo storage
      fetchUser(storedToken); // Potom načítaj usera s týmto tokenom
    } else {
      setIsLoading(false); // Ak nie je token v storage, nie je čo načítavať
    }
  }, [fetchUser]); // useEffect závisí od fetchUser (ktorý je teraz stabilný vďaka useCallback)

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    fetchUser(newToken); // Načítaj používateľské dáta po prihlásení
  };

  return (
    <AuthContext.Provider value={{ 
        token, 
        user, 
        isLoading, 
        login, 
        logout: performLogout, // Použi stabilnú referenciu na logout
        fetchUser, 
        setUser // <<<< PRIDANÝ setUser DO VALUE OBJEKTU
    }}>
      {children}
    </AuthContext.Provider>
  );
};