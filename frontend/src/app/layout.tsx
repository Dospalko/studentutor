// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner"; // <<<< NOVÝ IMPORT (alebo priamo 'sonner')

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personalizovaný Tutor",
  description: "Váš AI študijný partner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body className={`${inter.className} antialiased`}> {/* Pridal som antialiased sem */}
        <AuthProvider>
          <Navbar />
          <main className="pt-16 bg-background text-foreground min-h-[calc(100vh-4rem-57px)]"> {/* Navbar + Footer height */}
            {children}
          </main>
          <Toaster richColors position="top-right" /> {/* <<<< PRIDANÝ TOASTER */}
        </AuthProvider>
      </body>
    </html>
  );
}