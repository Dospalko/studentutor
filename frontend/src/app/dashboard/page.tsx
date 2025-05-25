// frontend/src/app/dashboard/page.tsx
"use client";

import ProtectedRoute from '@/components/ProtectedRoute';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

function DashboardContent() {
  const authContext = useContext(AuthContext);
  // Ak by si potreboval authContext tu, môžeš ho použiť.
  // Ale ProtectedRoute už zabezpečuje, že user existuje (alebo skôr token)

  if (!authContext || !authContext.user) {
    return <p>Načítavam dáta používateľa...</p>; // Alebo iný loading stav
  }

  const { user } = authContext;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Vitaj na svojom Dashboarde, {user.full_name || user.email}!</h1>
      <p className="mb-4">Toto je tvoj osobný priestor na správu študijných plánov.</p>
      {/* Tu bude obsah dashboardu */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">Tvoje Aktuálne Predmety</h2>
        <p className="text-gray-600">Zatiaľ žiadne predmety pridané.</p>
        {/* Neskôr tu zobrazíme zoznam predmetov */}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}