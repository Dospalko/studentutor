// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext"; // Importuj AuthProvider
import Navbar from "@/components/Navbar";
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
      <body className={inter.className}>
        <AuthProvider> {/* Obklop aplikáciu AuthProviderom */}
          <Navbar /> {/* Pridáme Navbar */}
          <main className="pt-16"> {/* Pridaj padding top, ak je Navbar fixný */}
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}