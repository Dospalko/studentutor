// frontend/src/app/subjects/[subjectId]/page.tsx
"use client";

import { useContext, useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useParams pre získanie subjectId z URL
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthContext } from '@/context/AuthContext';
import { getSubjectById, Subject } from '@/services/subjectService';
// Neskôr pridáme importy pre topicService
// import { Topic, TopicCreate, createTopicForSubject, getTopicsForSubject } from '@/services/topicService';


function SubjectDetailPageContent() {
  const authContext = useContext(AuthContext);
  const params = useParams(); // Získa { subjectId: "..." }
  const router = useRouter();
  const subjectId = params.subjectId ? parseInt(params.subjectId as string) : null;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stavy pre formulár na pridanie témy (pridáme neskôr)
  // const [newTopicName, setNewTopicName] = useState('');
  // const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

  useEffect(() => {
    if (authContext?.token && subjectId) {
      setIsLoading(true);
      setError(null);
      getSubjectById(subjectId, authContext.token)
        .then(data => {
          setSubject(data);
        })
        .catch(err => {
          console.error("Error fetching subject details:", err);
          setError(err.message || 'Nepodarilo sa načítať detail predmetu.');
          if (err.message.toLowerCase().includes("not found")) {
            // Prípadne presmeruj, ak predmet neexistuje
            // router.push('/dashboard');
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!subjectId) {
        setError("Chýba ID predmetu.");
        setIsLoading(false);
    }
  }, [authContext?.token, subjectId, router]);

  if (!authContext?.user) {
    return <p className="text-center mt-10">Načítavam...</p>;
  }

  if (isLoading) {
    return <p className="text-center mt-10">Načítavam detail predmetu...</p>;
  }

  if (error) {
    return <p className="text-center mt-10 text-red-500 bg-red-100 p-4 rounded-md">{error}</p>;
  }

  if (!subject) {
    return <p className="text-center mt-10">Predmet nebol nájdený.</p>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <button
        onClick={() => router.back()}
        className="mb-6 text-indigo-600 hover:text-indigo-800 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Späť na Dashboard
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">{subject.name}</h1>
      {subject.description && <p className="text-gray-600 mb-6">{subject.description}</p>}

      {/* Sekcia pre témy */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Témy predmetu</h2>
        {subject.topics && subject.topics.length > 0 ? (
          <ul className="space-y-3">
            {subject.topics.map(topic => (
              <li key={topic.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                <h3 className="text-md font-medium text-gray-800">{topic.name}</h3>
                {/* Tu zobrazíme ďalšie detaily témy, napr. status, obtiažnosť */}
                <p className="text-sm text-gray-500">Status: {topic.status}</p>
                {topic.user_strengths && <p className="text-xs text-green-600 mt-1">Silné stránky: {topic.user_strengths}</p>}
                {topic.user_weaknesses && <p className="text-xs text-red-600 mt-1">Slabé stránky: {topic.user_weaknesses}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">Tento predmet zatiaľ nemá žiadne témy.</p>
        )}
        {/* TODO: Formulár na pridanie novej témy */}
      </div>

      {/* TODO: Možnosť editovať predmet */}
    </div>
  );
}

export default function SubjectDetailPage() {
  return (
    <ProtectedRoute>
      <SubjectDetailPageContent />
    </ProtectedRoute>
  );
}