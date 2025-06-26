"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (newToken: string) => void;
  logout: () => void;
  fetchUser: (currentToken?: string) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

/*  ➜ nechávame undefined, aby sme odhalili chýbajúci <AuthProvider>  */
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface Props {
  children: ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* logout v callbacku – nemenná referencia */
  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  }, []);

  /* -------- fetchUser -------- */
  const fetchUser = useCallback(
    async (currentToken?: string) => {
      const tk = currentToken ?? token;
      if (!tk) {
        setUser(null);
        setIsLoading(false);
        return;
      }
  
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${tk}` },
        });
  
        if (res.status === 401) {
          console.warn("Unauthorized – logging out...");
          logout();
          return;
        }
  
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`fetchUser failed: ${res.status} ${errorText}`);
          throw new Error(`Status ${res.status}`);
        }
  
        const userData: User = await res.json();
        setUser(userData);
      } catch (err) {
        console.error("fetchUser error:", err);
        logout(); // fallback logout
      } finally {
        setIsLoading(false);
      }
    },
    [token, logout]
  );
  

  /* inicializácia na mount */
  useEffect(() => {
    const stored = localStorage.getItem("authToken");
    if (stored) {
      setToken(stored);
      fetchUser(stored);
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  /* login helper */
  const login = (newToken: string) => {
    localStorage.setItem("authToken", newToken);
    setToken(newToken);
    fetchUser(newToken);
  };

  const value: AuthContextType = {
    token,
    user,
    isLoading,
    login,
    logout,
    fetchUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
