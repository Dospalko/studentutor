import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

/**
 * Zaručuje, že vždy dostaneš NON-undefined kontext.
 * Ak by niekde chýbal <AuthProvider>, vyhodí jasnú chybu.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
};
