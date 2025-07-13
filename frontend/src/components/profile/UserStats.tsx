"use client";

import { useEffect, useState, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { fetchUserStats } from "@/services/studyMaterialService";
import type { UserStats } from "@/services/studyMaterialService";
import { AuthContext } from "@/context/AuthContext";

export default function UserStats() {
  const { token } = useContext(AuthContext)!;
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchUserStats(token)
      .then(setStats)
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Moje Štatistiky</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">Materiály</p>
          <p className="text-xl font-bold">{stats.materials.total}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Súhrny</p>
          <p className="text-xl font-bold">{stats.total_summaries}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Tagované</p>
          <p className="text-xl font-bold">{stats.total_tagged}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Slová</p>
          <p className="text-xl font-bold">
            {stats.total_words.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
