// frontend/src/app/login/page.tsx
"use client";

import { useState, FormEvent, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext'; // Vytvoríme ho v ďalšom kroku

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function LoginPage() {
  const [email, setEmail] = useState(''); // Email bude slúžiť ako username pre OAuth2PasswordRequestForm
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    // Toto by sa nemalo stať, ak je AuthProvider správne nastavený na najvyššej úrovni
    throw new Error("AuthContext not found. Make sure AuthProvider is wrapping your application.");
  }
  const { login } = authContext;


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Dáta pre OAuth2PasswordRequestForm musia byť vo formáte 'x-www-form-urlencoded'
    const formData = new URLSearchParams();
    formData.append('username', email); // FastAPI OAuth2PasswordRequestForm očakáva 'username'
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
        login(data.access_token); // Uloží token a aktualizuje stav pomocou AuthContext
        router.push('/'); // Presmeruj na hlavnú stránku po úspešnom prihlásení
      } else {
        setError('Login failed: No token received.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">Login</h1>
        {error && <p className="text-red-500 text-sm mb-4 bg-red-100 p-3 rounded">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              autoComplete="email"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Log In
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-sm text-gray-600">
        Dont have an account?{' '}
        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
          Register here
        </Link>
      </p>
    </div>
  );
}