// frontend/src/components/profile/UserStats.tsx
"use client";

import { useEffect, useState, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { fetchUserStats, type UserStats } from "@/services/studyMaterialService";
import { AuthContext } from "@/context/AuthContext";

export default function UserStats() {
  const { token } = useContext(AuthContext)!;
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchUserStats(token)
      .then((data) => setStats(data))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  if (error || !stats) {
    return (
      <Card>
        <CardContent className="py-4 text-center text-destructive">
          Chyba načítania štatistík: {error}
        </CardContent>
      </Card>
    );
  }

  const {
    materials,
    subjects,
    study_blocks: blocks,
    achievements_unlocked: achievements,
  } = stats;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moje Štatistiky</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
        {/* Materiály */}
        <div>
          <p className="text-sm text-muted-foreground">Materiály</p>
          <p className="text-xl font-bold">{materials.total}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Súhrny</p>
          <p className="text-xl font-bold">{materials.summaries}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tagované</p>
          <p className="text-xl font-bold">{materials.tagged}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Slová</p>
          <p className="text-xl font-bold">
            {materials.words_extracted.toLocaleString()}
          </p>
        </div>

        {/* Predmety & témy */}
        <div>
          <p className="text-sm text-muted-foreground">Predmety</p>
          <p className="text-xl font-bold">{subjects.total}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Témy</p>
          <p className="text-xl font-bold">{subjects.topics}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Témy dokončené</p>
          <p className="text-xl font-bold">{subjects.topics_completed}</p>
        </div>

        {/* Študijné bloky */}
        <div>
          <p className="text-sm text-muted-foreground">Bloky</p>
          <p className="text-xl font-bold">{blocks.total}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Dokončené</p>
          <p className="text-xl font-bold">{blocks.completed}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Preskočené</p>
          <p className="text-xl font-bold">{blocks.skipped}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Minúty</p>
          <p className="text-xl font-bold">
            {blocks.minutes_scheduled.toLocaleString()}
          </p>
        </div>

        {/* Achievementy */}
        <div>
          <p className="text-sm text-muted-foreground">Achievementy</p>
          <p className="text-xl font-bold">{achievements}</p>
        </div>
      </CardContent>
    </Card>
  );
}
