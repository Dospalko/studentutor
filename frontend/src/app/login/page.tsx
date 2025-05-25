// frontend/src/app/login/page.tsx
"use client";

import { useState, FormEvent, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext';
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

// Shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Pre chybové hlášky

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    // Zváž, či tu nevyhodiť chybu alebo zobraziť fallback UI,
    // ak AuthProvider nie je dostupný.
    // Pre produkciu by to mal AuthProvider obaliť celú aplikáciu.
    console.error("AuthContext not found in LoginPage");
    // Môžeš tu zobraziť nejaký loading/error state, alebo nechať tak,
    // ak si si istý, že AuthProvider je vždy prítomný.
    return <div>Loading authentication context...</div>;
  }
  const { login, isLoading: authIsLoading } = authContext;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      if (data.access_token) {
        login(data.access_token);
        router.push('/dashboard');
      } else {
        setError('Login failed: No token received.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Vitajte Späť!</CardTitle> {/* Používame text-primary */}
          <CardDescription className="mt-2">Prihláste sa a pokračujte v učení.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              {/* <AlertCircle className="h-4 w-4" />  Môžeš pridať ikonu pre Alert */}
              <AlertTitle>Chyba pri prihlásení</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="pl-10" // Padding pre ikonu
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
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pl-10" // Padding pre ikonu
                />
              </div>
            </div>
            <Button type="submit" disabled={authIsLoading} className="w-full">
              {authIsLoading ? 'Prihlasujem...' : 'Prihlásiť sa'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Ešte nemáte účet?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Zaregistrujte sa tu
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}