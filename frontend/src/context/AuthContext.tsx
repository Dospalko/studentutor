// frontend/src/context/AuthContext.tsx
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (newToken: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>; // Funkcia na načítanie používateľa
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Na začiatku načítavame

  const fetchUser = React.useCallback(async (currentToken?: string) => {
    const tokenToUse = currentToken || token;
    if (!tokenToUse) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Ak token nie je platný (napr. expirovaný), vyčisti ho
        console.error('Failed to fetch user, token might be invalid');
        logout(); // Odhlási používateľa, ak token nie je platný
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null); // V prípade chyby tiež odhlásime
    } finally {
      setIsLoading(false);
    }
  }, [token]); // Add token as a dependency


  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken); // Načítaj používateľa, ak je token v localStorage
    } else {
      setIsLoading(false); // Žiadny token, nenačítavame
    }
  }, [fetchUser]); // fetchUser is now stable due to useCallback

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    fetchUser(newToken); // Načítaj používateľské dáta po prihlásení
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};