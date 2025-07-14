"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Calendar,
  GraduationCap,
  TrendingUp,
  BookCopy,
  Target,
  Award,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "./StatCard";
import { CreateSubjectDialog } from "./CreateSubjectDialog";

interface DashboardStats {
  totalSubjects: number;
  totalTopics: number;
  completedTopics: number;
  overallProgress: number;
  activeSubjects: number;
}

interface DashboardHeroProps {
  userName: string;
  stats: DashboardStats;
  onCreateSubject: (name: string, description: string) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  isCreateDialogOpen: boolean;
  onCreateDialogChange: (open: boolean) => void;
  hasSubjects: boolean;
}

export function DashboardHero({
  userName,
  stats,
  onCreateSubject,
  isSubmitting,
  error,
  isCreateDialogOpen,
  onCreateDialogChange,
  hasSubjects,
}: DashboardHeroProps) {
  return (
    <section className="">
      {/* ——— subtle blobs ——— */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-secondary/30 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 m-auto h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 px-6 py-10 md:px-12 lg:py-16">
        {/* ——— TOP GRID ——— */}
        <div className="grid gap-12 lg:grid-cols-12">
          {/* → Welcome text */}
          <header className="lg:col-span-7">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Dashboard
              </Badge>
              <Badge
                variant="outline"
                className="border-secondary/30 bg-secondary/10 text-secondary"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {new Date().toLocaleDateString("sk-SK", { weekday: "long" })}
              </Badge>
            </div>

            <h1 className="mb-6 max-w-2xl bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              Vitaj späť,
              <span className="block sm:inline"> {userName}! 👋</span>
            </h1>

            <p className="mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Spravuj predmety, sleduj progres a posuň svoje štúdium na ďalší
              level s pomocou&nbsp;AI.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              {/* CTA – nový predmet */}
              <CreateSubjectDialog
                isOpen={isCreateDialogOpen}
                onOpenChange={onCreateDialogChange}
                onSubmit={onCreateSubject}
                isSubmitting={isSubmitting}
                error={error}
              />
              {/* CTA – profil */}
              {hasSubjects && (
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="group bg-transparent"
                >
                  <Link href="/profile">
                    <Award className="mr-2 h-5 w-5" />
                    Môj Profil
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              )}
            </div>
          </header>

          {/* → Stats */}
          <aside className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            <StatCard
              icon={<TrendingUp className="h-6 w-6 text-white" />}
              label="Celkový pokrok"
              value={`${stats.overallProgress}%`}
              subtitle={`${stats.completedTopics} z ${stats.totalTopics} tém`}
              gradient="from-blue-500 to-blue-600"
            />
            <StatCard
              icon={<GraduationCap className="h-6 w-6 text-white" />}
              label="Aktívne predmety"
              value={stats.activeSubjects}
              subtitle={`${stats.totalSubjects} celkom`}
              gradient="from-green-500 to-green-600"
              delay={100}
            />
            <StatCard
              icon={<BookCopy className="h-6 w-6 text-white" />}
              label="Témy celkom"
              value={stats.totalTopics}
              subtitle="Všetky témy"
              gradient="from-purple-500 to-purple-600"
              delay={200}
            />
            <StatCard
              icon={<Target className="h-6 w-6 text-white" />}
              label="Dokončené"
              value={stats.completedTopics}
              subtitle="Hotové témy"
              gradient="from-amber-500 to-amber-600"
              delay={300}
            />
          </aside>
        </div>

    
      </div>
    </section>
  );
}
