// frontend/src/app/dashboard/page.tsx
"use client";

import ProtectedRoute from '@/components/ProtectedRoute';
import { useContext, useEffect, useState, FormEvent } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { getSubjects, createSubject, Subject, SubjectCreate, deleteSubject } from '@/services/subjectService';
import Link from 'next/link'; // Pre odkazy na detail predmetu

function DashboardContent() {
  const authContext = useContext(AuthContext);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stavy pre formulár na pridanie predmetu
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDescription, setNewSubjectDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authContext?.token) {
      setIsLoadingSubjects(true);
      setError(null);
      getSubjects(authContext.token)
        .then(data => {
          setSubjects(data);
        })
        .catch(err => {
          console.error("Error fetching subjects:", err);
          setError(err.message || 'Nepodarilo sa načítať predmety.');
        })
        .finally(() => {
          setIsLoadingSubjects(false);
        });
    }
  }, [authContext?.token]);

  const handleCreateSubject = async (e: FormEvent) => {
    e.preventDefault();
    if (!authContext?.token || !newSubjectName.trim()) {
      setError("Názov predmetu je povinný.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const subjectData: SubjectCreate = {
      name: newSubjectName.trim(),
      description: newSubjectDescription.trim() || null,
    };

    try {
      const created = await createSubject(subjectData, authContext.token);
      setSubjects(prevSubjects => [created, ...prevSubjects]); // Pridaj na začiatok zoznamu
      setNewSubjectName(''); // Vyčisti formulár
      setNewSubjectDescription('');
    } catch (err: unknown) {
      console.error("Error creating subject:", err);
      setError(err instanceof Error ? err.message : 'Nepodarilo sa vytvoriť predmet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (!authContext?.token || !confirm('Naozaj chcete zmazať tento predmet a všetky jeho témy?')) {
        return;
    }
    try {
        await deleteSubject(subjectId, authContext.token);
        setSubjects(prevSubjects => prevSubjects.filter(s => s.id !== subjectId));
    } catch (err: unknown) {
      console.error("Error deleting subject:", err);
      setError(err instanceof Error ? err.message : 'Nepodarilo sa zmazať predmet.');
    }
  };


  if (!authContext || !authContext.user) {
    return <p className="text-center mt-10">Načítavam dáta používateľa...</p>;
  }
  const { user } = authContext;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Vitaj na Dashboarde, {user.full_name || user.email}!
      </h1>

      {/* Formulár na pridanie nového predmetu */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Pridať Nový Predmet</h2>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
        <form onSubmit={handleCreateSubject}>
          <div className="mb-4">
            <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-1">
              Názov predmetu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subjectName"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="subjectDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Popis (voliteľné)
            </label>
            <textarea
              id="subjectDescription"
              value={newSubjectDescription}
              onChange={(e) => setNewSubjectDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newSubjectName.trim()}
            className="w-full sm:w-auto bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Pridávam...' : 'Pridať predmet'}
          </button>
        </form>
      </div>

      {/* Zoznam predmetov */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Tvoje Predmety</h2>
        {isLoadingSubjects ? (
          <p>Načítavam predmety...</p>
        ) : subjects.length > 0 ? (
          <ul className="space-y-4">
            {subjects.map((subject) => (
              <li key={subject.id} className="border border-gray-200 p-4 rounded-md hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <Link href={`/subjects/${subject.id}`} className="text-lg font-medium text-indigo-600 hover:text-indigo-800">
                        {subject.name}
                    </Link>
                    {subject.description && <p className="text-sm text-gray-600 mt-1">{subject.description}</p>}
                    <p className="text-xs text-gray-500 mt-1">Počet tém: {subject.topics?.length || 0}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium p-2 rounded hover:bg-red-50"
                    title="Zmazať predmet"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">Zatiaľ nemáš pridané žiadne predmety. Začni pridaním nového!</p>
        )}
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