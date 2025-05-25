"use client";

import { useState, FormEvent, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext';
import { UserPlusIcon, LockClosedIcon, EnvelopeIcon, UserIcon as UserOutlineIcon } from '@heroicons/react/24/outline'; // Alebo lucide

// Shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    // Handle case where AuthContext is not available, e.g., show a loading state or error
    console.error("AuthContext not found in RegisterPage");
    return <div>Loading authentication context...</div>; // Or a more sophisticated loading UI
  }
  const { isLoading: authIsLoading } = authContext;


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) { // Príklad jednoduchej validácie na frontende
        setError("Heslo musí mať aspoň 6 znakov.");
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      setSuccess('Registrácia úspešná! Teraz sa môžete prihlásiť.');
      // Redirect to login page after successful registration
      router.push('/login');
      setEmail('');
      setPassword('');
      setFullName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlusIcon className="w-12 h-12 mx-auto text-primary mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Vytvoriť Účet</CardTitle>
          <CardDescription className="mt-2">Zadajte svoje údaje a začnite svoju cestu k vedomostiam.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Chyba pri registrácii</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="mb-6 bg-green-50 border-green-300 text-green-700"> {/* Custom success alert */}
              <AlertTitle>Úspech!</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Celé meno (nepovinné)</Label>
              <div className="relative">
                <UserOutlineIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ján Vzorový"
                  autoComplete="name"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Emailová adresa</Label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="vas@email.com"
                  autoComplete="email"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 6 znakov"
                  autoComplete="new-password"
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={authIsLoading} className="w-full">
              {authIsLoading ? 'Registrujem...' : 'Zaregistrovať sa'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Už máte účet?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Prihláste sa tu
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}