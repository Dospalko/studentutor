"use client";

import { useEffect, useState, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Sparkles, Tags, AlignJustify, GraduationCap, BookOpenCheck, 
         Layers, CheckCircle2, SkipForward, Clock8, Award } from "lucide-react";
import { fetchUserStats, type UserStats } from "@/services/studyMaterialService";
import { AuthContext } from "@/context/AuthContext";

/* ───────────────────────────────────────── helpers ──────────────────────────────────────── */
const StatBox = ({
  icon,
  label,
  value,
  color = "text-primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color?: string;
}) => (
  <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border bg-muted/40 hover:bg-muted/60 transition p-3 shadow-sm">
    <span className={`p-2 rounded-full bg-primary/10 ${color}`}>{icon}</span>
    <span className="text-xl font-bold leading-none">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);
/* ─────────────────────────────────────────────────────────────────────────────────────────── */

export default function UserStats() {
  const { token } = useContext(AuthContext)!;
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  /* fetch once on mount */
  useEffect(() => {
    if (!token) return;
    fetchUserStats(token)
      .then(setStats)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [token]);

  /* loading & error states */
  if (loading)
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );

  if (error || !stats)
    return (
      <Card>
        <CardContent className="py-4 text-center text-destructive">
          Chyba načítania štatistík: {error}
        </CardContent>
      </Card>
    );

  /* destructure with safe defaults */
  const {
    materials,
    subjects,
    study_blocks: blocks = {
      total: 0, completed: 0, skipped: 0, minutes_scheduled: 0,
    },
    achievements_unlocked: achievements,
  } = stats;

  /* minutes → hh : mm for nicer display */
  const prettyMinutes = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle>Moje Štatistiky</CardTitle>
        </div>
        {/* little badge shows total items tracked */}
        <Badge variant="outline" className="text-xs">
          {materials.total + subjects.total + blocks.total} položiek
        </Badge>
      </CardHeader>

      <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* ─────────── MATERIALS ─────────── */}
        <StatBox icon={<FileText className="h-4 w-4" />} label="Materiály"  value={materials.total} />
        <StatBox icon={<AlignJustify className="h-4 w-4" />} label="Súhrny" value={materials.summaries} />
        <StatBox icon={<Tags className="h-4 w-4" />} label="Tagované" value={materials.tagged} />
        <StatBox icon={<BookOpenCheck className="h-4 w-4" />} label="Slová" value={materials.words_extracted.toLocaleString()} />

        {/* ─────────── SUBJECTS / TOPICS ─────────── */}
        <StatBox icon={<GraduationCap className="h-4 w-4" />} label="Predmety" value={subjects.total} color="text-secondary" />
        <StatBox icon={<Layers className="h-4 w-4" />} label="Témy" value={subjects.topics} color="text-secondary" />
        <StatBox icon={<CheckCircle2 className="h-4 w-4" />} label="Témy Hotové" value={subjects.topics_completed} color="text-secondary" />

        {/* ─────────── STUDY BLOCKS ─────────── */}
        <StatBox icon={<Clock8 className="h-4 w-4" />} label="Bloky" value={blocks.total}  color="text-amber-600" />
        <StatBox icon={<CheckCircle2 className="h-4 w-4" />} label="Bloky OK" value={blocks.completed} color="text-amber-600" />
        <StatBox icon={<SkipForward className="h-4 w-4" />} label="Preskočené" value={blocks.skipped} color="text-amber-600" />
        <StatBox icon={<Clock8 className="h-4 w-4" />} label="Minúty" value={prettyMinutes(blocks.minutes_scheduled)} color="text-amber-600" />

        {/* ─────────── ACHIEVEMENTS ─────────── */}
        <StatBox icon={<Award className="h-4 w-4" />} label="Achievementy" value={achievements} color="text-green-600" />
      </CardContent>
    </Card>
  );
}
