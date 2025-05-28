// frontend/src/app/page.tsx
"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowRight, BookCheck, CalendarDays, BarChart3, Zap,Edit3, Brain,BrainCog, Target } from "lucide-react";
import { useContext, useEffect } from 'react'; // Pre presmerovanie
import { AuthContext } from '@/context/AuthContext'; // Pre presmerovanie
import { useRouter } from 'next/navigation'; // Pre presmerovanie
import { Loader2 } from 'lucide-react'; // Pre loading pri presmerovaní

// Komponenty sekcií
function HeroSection() {
  return (
    <section className="w-full py-20 md:py-28 lg:py-32 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-primary-foreground dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 relative overflow-hidden">
      {/* Voliteľný jemný pattern na pozadí alebo abstraktné tvary */}
      {/* <div className="absolute inset-0 opacity-5 animate-pulse">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/></pattern></defs><rect width="100%" height="100%" fill="url(#smallGrid)" /></svg>
      </div> */}
      <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Badge nad nadpisom */}
          <div className="mb-6 flex justify-center">
            <Link href="/#features" className="inline-flex items-center rounded-full bg-primary-foreground/20 dark:bg-slate-700/50 px-4 py-1.5 text-sm font-medium text-primary dark:text-sky-300 transition-colors hover:bg-primary-foreground/30 dark:hover:bg-slate-600/50">
              Objavte silu AI v učení <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
            Váš Inteligentný <span className="block sm:inline bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-sky-300 to-indigo-300">Študijný Partner</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 dark:text-slate-300 max-w-2xl mx-auto">
            Prestaňte sa trápiť s plánovaním a učením naslepo. Naša AI vám vytvorí personalizovaný študijný plán, pomôže vám identifikovať slabé miesta a efektívne dosiahnuť vaše ciele.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/register" legacyBehavior passHref>
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-3 bg-white text-primary hover:bg-gray-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-xl transition-transform transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
                Vytvoriť Účet Zdarma
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" legacyBehavior passHref>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-3 border-blue-200 text-blue-100 hover:bg-blue-700/70 hover:border-blue-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/50 transition-colors">
                Už mám účet
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  className?: string;
}

function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <div className={`flex flex-col items-center p-6 text-center bg-card dark:bg-slate-800/70 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${className}`}>
      <div className="mb-5 p-4 bg-gradient-to-br from-primary/10 to-blue-500/10 dark:from-primary/20 dark:to-blue-500/20 rounded-full text-primary dark:text-sky-400">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-card-foreground dark:text-gray-100">{title}</h3>
      <p className="text-sm text-muted-foreground dark:text-slate-300 leading-relaxed">{description}</p>
    </div>
  );
}

function FeaturesSection() {
  const features: FeatureCardProps[] = [
    {
      icon: Brain, // Zmenená ikona
      title: "Inteligentné Plány",
      description: "AI analyzuje vaše silné a slabé stránky a vytvára študijný plán šitý na mieru.",
    },
    {
      icon: CalendarDays,
      title: "Interaktívny Kalendár",
      description: "Majte dokonalý prehľad o svojich študijných blokoch v intuitívnom kalendári.",
    },
    {
      icon: BarChart3,
      title: "Sledovanie Pokroku",
      description: "Vizualizujte svoj progres, sledujte dokončené témy a zostaňte neustále motivovaní.",
    },
    {
      icon: Zap,
      title: "Efektívne Učenie",
      description: "Zamerajte sa na oblasti, kde potrebujete najväčšie zlepšenie a učte sa efektívnejšie.",
    },
  ];

  return (
    <section id="features" className="w-full py-16 md:py-24 bg-background dark:bg-slate-900/50 scroll-mt-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground dark:text-gray-100">
            Revolúcia vo Vašom Štúdiu
          </h2>
          <p className="mt-4 text-muted-foreground dark:text-slate-300">
            Objavte funkcie, ktoré vám pomôžu dosiahnuť akademický úspech bez zbytočného stresu a s radosťou z učenia.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} {...feature} className={`animate-fade-in-up animation-delay-${index * 100}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Nová sekcia "Ako to funguje"
function HowItWorksSection() {
    const steps = [
        {
            icon: Edit3, // Ikona pre zadanie info (upravil som Edit3 z tvojho predchádzajúceho kódu)
            title: "1. Zadajte Informácie",
            description: "Povedzte nám o predmete, vašich aktuálnych vedomostiach, silných a slabých stránkach."
        },
        {
            icon: BrainCog, // Ikona pre AI generovanie
            title: "2. AI Vytvorí Plán",
            description: "Naša inteligentná platforma analyzuje vaše dáta a vygeneruje optimálny študijný plán."
        },
        {
            icon: BookCheck, // Ikona pre štúdium
            title: "3. Študujte Efektívne",
            description: "Sledujte svoj personalizovaný plán, využívajte interaktívny kalendár a sústreďte sa na to podstatné."
        },
        {
            icon: Target, // Ikona pre dosiahnutie cieľov
            title: "4. Dosiahnite Ciele",
            description: "Sledujte svoj pokrok, oslavujte úspechy a dosiahnite svoje akademické ciele s ľahkosťou."
        }
    ];

    return (
        <section className="w-full py-16 md:py-24 bg-muted/50 dark:bg-slate-800/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="max-w-xl mx-auto text-center mb-12 md:mb-16">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground dark:text-gray-100">
                        Ako To Funguje?
                    </h2>
                    <p className="mt-4 text-muted-foreground dark:text-slate-300">
                        Začať je jednoduché. Sledujte tieto kroky k úspešnému štúdiu.
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step, index) => (
                        <div key={step.title} className={`flex flex-col items-center text-center animate-fade-in-up animation-delay-${index * 150}`}>
                            <div className="mb-5 flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 text-primary dark:text-sky-400 ring-4 ring-primary/10 dark:ring-sky-400/20">
                                <step.icon className="h-8 w-8" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-card-foreground dark:text-gray-100">{step.title}</h3>
                            <p className="text-sm text-muted-foreground dark:text-slate-300 leading-relaxed">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


function CallToActionBottom() {
    return (
        <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-primary-foreground dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <div className="max-w-xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                        Pripravení Zmeniť Svoje Štúdium?
                    </h2>
                    <p className="mt-6 text-lg text-blue-100 dark:text-slate-300">
                        Pridajte sa k študentom, ktorí transformujú svoje učenie. Vytvorte si účet zdarma a objavte silu personalizovaného štúdia ešte dnes.
                    </p>
                    <div className="mt-10">
                        <Link href="/register" legacyBehavior passHref>
                            <Button size="lg" className="px-10 py-4 text-xl bg-white text-primary hover:bg-gray-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-xl transition-transform transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary">
                                Začať Teraz Zdarma
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function HomePage() {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // Ak je používateľ prihlásený (a nie sme už na dashboarde), presmeruj ho
    if (authContext?.user && router && typeof window !== 'undefined' && window.location.pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  }, [authContext?.user, router]);

  // Zobraz loading, kým sa overuje stav prihlásenia, alebo ak je používateľ prihlásený a čaká na presmerovanie
  if (authContext?.isLoading || (authContext?.user && typeof window !== 'undefined' && window.location.pathname !== '/dashboard')) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background dark:bg-slate-900">
        <Loader2 className="h-16 w-16 animate-spin text-primary"/>
        <p className="mt-4 text-muted-foreground dark:text-slate-400">Načítavam aplikáciu...</p>
      </div>
    );
  }

  // Ak používateľ nie je prihlásený, zobraz landing page
  return (
    <>
      {/* Navbar bude zobrazený cez RootLayout (predpokladáme, že existuje) */}
      <main className="flex-grow bg-background dark:bg-slate-900/70">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection /> {/* Pridaná nová sekcia */}
        <CallToActionBottom />
      </main>
      {/* Jednoduchá pätička */}
      <footer className="py-8 text-center text-sm text-muted-foreground dark:text-slate-400 bg-muted dark:bg-slate-800">
        © {new Date().getFullYear()} TutorAI. Všetky práva vyhradené.
      </footer>
    </>
  );
}