// frontend/src/app/register/page.tsx
"use client";

import { useState, FormEvent } from 'react';
// import { useRouter } from 'next/navigation'; // Ak potrebuješ presmerovanie

// Načítanie API URL z premennej prostredia
// process.env.NEXT_PUBLIC_API_URL bude nastavené Docker Compose
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'; // Fallback pre lokálny vývoj mimo Dockeru

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Použi API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        // FastAPI zvyčajne vracia chyby v data.detail
        throw new Error(data.detail || `Registration failed with status: ${response.status}`);
      }

      setSuccess('Registration successful! You can now log in.');
      setEmail(''); // Vyčisti polia po úspechu
      setPassword('');
      setFullName('');
      // router.push('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-700">Register</h1>
        {error && <p className="text-red-500 text-sm mb-4 bg-red-100 p-3 rounded">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-4 bg-green-100 p-3 rounded">{success}</p>}
        <form onSubmit={handleSubmit}>
          {/* ... formulárové polia zostávajú rovnaké ... */}
          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
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
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Register
          </button>
        </form>
      </div>
      {/* Link na login, ak ho máš */}
      {/* <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Log in
        </a>
      </p> */}
    </div>
  );
}