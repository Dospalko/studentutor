// frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Alebo iný vhodný font
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

// Príklad použitia iného fontu, napr. Poppins pre moderný vzhľad
// import { Poppins } from "next/font/google";
// const font = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const font = Inter({ subsets: ["latin"] }); // Ponecháme Inter, je to dobrý default

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
      <body className={`${font.className} min-h-screen flex flex-col`}> {/* `min-h-screen flex flex-col` pre footer na spodku ak by bol */}
        <AuthProvider>
          <Navbar />
          <main className="flex-grow pt-20 pb-8 md:pt-24"> {/* Viac paddingu pre Navbar a priestor dole */}
            {children}
          </main>
          {/* Tu by mohol byť Footer */}
          {/* <footer className="bg-slate-800 text-slate-300 text-center p-4">
            © 2024 Personalizovaný Tutor
          </footer> */}
        </AuthProvider>
      </body>
    </html>
  );
}