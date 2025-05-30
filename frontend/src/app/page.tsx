// frontend/src/app/page.tsx
"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowRight, BookCheck, CalendarDays, BarChart3, Zap, Brain, Target, Edit3, BrainCog, Sparkles } from "lucide-react"; // Pridaná Sparkles
import { useContext, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Štýly pre animovaný gradient (môžu byť v globals.css alebo priamo tu, ak je to len pre tento komponent)
const animatedGradientStyles = `
  .animated-gradient {
    background-size: 200% 200%;
    animation: gradientAnimation 12s ease infinite;
  }

  @keyframes gradientAnimation {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;


// Komponenty sekcií
function HeroSection() {
  return (
    <section className="relative w-full py-24 md:py-32 lg:py-40 text-primary-foreground overflow-hidden">
      {/* Animované gradientové pozadie */}
      <div className="absolute inset-0 -z-10 animated-gradient bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 dark:from-slate-900 dark:via-indigo-900 dark:to-purple-900"></div>
      
      {/* Voliteľné: Jemné abstraktné tvary na pozadí */}
      <div className="absolute inset-0 -z-10 opacity-20 dark:opacity-10">
        <svg width="100%" height="100%" className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] animate-pulse duration-[5000ms]">
          <defs>
            <filter id="blurFilter">
              <feGaussianBlur in="SourceGraphic" stdDeviation="50" />
            </filter>
          </defs>
          <circle cx="20%" cy="30%" r="35%" fill="rgba(128, 90, 213, 0.3)" filter="url(#blurFilter)" />
          <circle cx="80%" cy="70%" r="30%" fill="rgba(236, 72, 153, 0.3)" filter="url(#blurFilter)" />
          <circle cx="50%" cy="50%" r="25%" fill="rgba(99, 102, 241, 0.2)" filter="url(#blurFilter)" />
        </svg>
      </div>


      <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 flex justify-center">
            <Link href="/#features" className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 shadow-md">
              <Sparkles className="mr-2 h-4 w-4 text-yellow-300" />
              Objavte kúzlo AI v učení
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl leading-tight drop-shadow-lg">
            Štúdium <span className="block sm:inline">Revolúcia.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 mt-1 sm:mt-2">
              S Vašou AI.
            </span>
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-indigo-100 dark:text-purple-200 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            Premeňte chaos na prehľadný plán. Naša platforma s umelou inteligenciou vám pomôže nielen plánovať, ale skutočne rozumieť a napredovať.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
            <Link href="/register" legacyBehavior passHref>
              <Button 
                size="lg" // Zväčšené tlačidlo
                className="w-full sm:w-auto text-lg px-10 py-4 bg-white text-indigo-700 font-semibold hover:bg-gray-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              >
                Vyskúšať Zdarma
                <ArrowRight className="ml-2.5 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/#features" legacyBehavior passHref>
              <Button 
                size="lg" 
                variant="link" 
                className="w-full sm:w-auto text-lg px-10 py-4 text-indigo-200 hover:text-white dark:text-purple-300 dark:hover:text-white transition-colors"
              >
                Ako to funguje?
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
    { icon: Brain, title: "Inteligentné Plány", description: "AI analyzuje vaše silné a slabé stránky a vytvára študijný plán šitý na mieru." },
    { icon: CalendarDays, title: "Interaktívny Kalendár", description: "Majte dokonalý prehľad o svojich študijných blokoch v intuitívnom kalendári." },
    { icon: BarChart3, title: "Sledovanie Pokroku", description: "Vizualizujte svoj progres, sledujte dokončené témy a zostaňte neustále motivovaní." },
    { icon: Zap, title: "Efektívne Učenie", description: "Zamerajte sa na oblasti, kde potrebujete najväčšie zlepšenie a učte sa efektívnejšie." },
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

function HowItWorksSection() {
    const steps = [
        { icon: Edit3, title: "1. Zadefinujte Svoje Potreby", description: "Povedzte nám o predmete, vašich aktuálnych vedomostiach, silných a slabých stránkach." },
        { icon: BrainCog, title: "2. AI Vytvorí Stratégiu", description: "Naša inteligentná platforma analyzuje vaše dáta a vygeneruje optimálny študijný plán." },
        { icon: BookCheck, title: "3. Študujte s Prehľadom", description: "Sledujte svoj personalizovaný plán, využívajte interaktívny kalendár a sústreďte sa na to podstatné." },
        { icon: Target, title: "4. Dosiahnite Výsledky", description: "Sledujte svoj pokrok, oslavujte úspechy a dosiahnite svoje akademické ciele s ľahkosťou." }
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
        <section className="w-full py-20 md:py-28 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-primary-foreground dark:from-slate-800 dark:via-indigo-800 dark:to-purple-800">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <div className="max-w-xl mx-auto">
                    <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-5xl drop-shadow-md">
                        Pripravení Zmeniť Svoje Štúdium?
                    </h2>
                    <p className="mt-6 text-lg text-indigo-100 dark:text-purple-200 leading-relaxed drop-shadow-sm">
                        Pridajte sa k študentom, ktorí transformujú svoje učenie. Vytvorte si účet zdarma a objavte silu personalizovaného štúdia ešte dnes.
                    </p>
                    <div className="mt-10">
                        <Link href="/register" legacyBehavior passHref>
                            <Button size="lg" className="px-10 py-4 text-xl bg-white text-indigo-700 font-semibold hover:bg-gray-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus-visible:ring-4 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900">
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
    if (authContext?.user && router && typeof window !== 'undefined' && window.location.pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  }, [authContext?.user, router]);

  if (authContext?.isLoading || (authContext?.user && typeof window !== 'undefined' && window.location.pathname !== '/dashboard')) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background dark:bg-slate-900">
        <Loader2 className="h-16 w-16 animate-spin text-primary"/>
        <p className="mt-4 text-muted-foreground dark:text-slate-400">Načítavam aplikáciu...</p>
        {/* Vloženie CSS pre animovaný gradient sem, aby sa aplikovalo len na túto stránku, ak sa načíta */}
        <style jsx global>{animatedGradientStyles}</style>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{animatedGradientStyles}</style> {/* Aplikuj globálne pre túto stránku */}
      <main className="flex-grow bg-background dark:bg-slate-900/70">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CallToActionBottom />
      </main>
      <footer className="py-8 text-center text-sm text-muted-foreground dark:text-slate-400 bg-muted dark:bg-slate-800">
        © {new Date().getFullYear()} TutorAI. Všetky práva vyhradené.
        {/* Pridaj odkaz na seba, ak chceš */}
        {/* <span className="mx-1">|</span>
        <a href="https://tvojweb.sk" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
          Tvoje Meno/Firma
        </a> */}
      </footer>
    </>
  );
}