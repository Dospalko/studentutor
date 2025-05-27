// frontend/src/app/page.tsx
"use client"; // Ak bude obsahovať interaktívne prvky alebo hooky

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowRight, BookCheck, CalendarDays, BarChart3, Zap } from "lucide-react"; // Ikony pre funkcie

// Komponenty sekcií
function HeroSection() {
  return (
    <section className="w-full py-20 md:py-28 lg:py-32 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-primary-foreground dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Váš Inteligentný <span className="block sm:inline">Študijný Partner</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 dark:text-slate-300 max-w-2xl mx-auto">
            Prestaňte sa trápiť s plánovaním a učením naslepo. Naša AI vám vytvorí personalizovaný študijný plán, pomôže vám identifikovať slabé miesta a efektívne dosiahnuť vaše ciele.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/register" legacyBehavior passHref>
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-white text-primary hover:bg-gray-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 shadow-lg transition-transform transform hover:scale-105">
                Vytvoriť Účet Zdarma
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" legacyBehavior passHref>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-blue-200 text-blue-100 hover:bg-blue-500/20 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/50 transition-colors">
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
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center p-6 text-center bg-card dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="mb-4 p-3 bg-primary/10 dark:bg-primary/20 rounded-full text-primary dark:text-sky-400">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-card-foreground dark:text-gray-100">{title}</h3>
      <p className="text-sm text-muted-foreground dark:text-slate-300">{description}</p>
    </div>
  );
}

function FeaturesSection() {
  const features: FeatureCardProps[] = [
    {
      icon: BookCheck,
      title: "Personalizované Plány",
      description: "AI analyzuje vaše silné a slabé stránky a vytvára študijný plán presne pre vás.",
    },
    {
      icon: CalendarDays,
      title: "Interaktívny Kalendár",
      description: "Majte prehľad o svojich študijných blokoch v intuitívnom kalendári.",
    },
    {
      icon: BarChart3,
      title: "Sledovanie Pokroku",
      description: "Vizualizujte svoj progres, sledujte dokončené témy a zostaňte motivovaní.",
    },
    {
      icon: Zap,
      title: "Efektívne Učenie",
      description: "Zamerajte sa na oblasti, kde potrebujete najväčšie zlepšenie a učte sa efektívnejšie.",
    },
  ];

  return (
    <section className="w-full py-16 md:py-24 bg-background dark:bg-slate-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground dark:text-gray-100">
            Revolúcia vo Vašom Štúdiu
          </h2>
          <p className="mt-4 text-muted-foreground dark:text-slate-300">
            Objavte funkcie, ktoré vám pomôžu dosiahnuť akademický úspech bez zbytočného stresu.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToActionBottom() {
    return (
        <section className="w-full py-16 md:py-24 bg-muted dark:bg-slate-800">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-foreground dark:text-gray-100 sm:text-4xl">
                    Pripravení Začať?
                </h2>
                <p className="mt-4 max-w-xl mx-auto text-muted-foreground dark:text-slate-300">
                    Pridajte sa k študentom, ktorí transformujú svoje učenie s našou AI platformou.
                </p>
                <div className="mt-8">
                    <Link href="/register" legacyBehavior passHref>
                        <Button size="lg" className="px-8 py-3 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-transform transform hover:scale-105">
                            Registrovať sa a Začať
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}


// Hlavný export stránky
export default function HomePage() {
  // Ak by si chcel, aby prihlásený používateľ bol presmerovaný na dashboard:
  // const authContext = useContext(AuthContext);
  // const router = useRouter();
  // useEffect(() => {
  //   if (authContext?.user) {
  //     router.push('/dashboard');
  //   }
  // }, [authContext?.user, router]);
  // if (authContext?.isLoading || authContext?.user) { // Zobraz loading alebo nič, kým sa presmeruje
  //   return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin"/></div>;
  // }

  return (
    <>
      {/* Navbar bude zobrazený cez RootLayout */}
      <main className="flex-grow"> {/* flex-grow zabezpečí, že main vyplní priestor k pätičke */}
        <HeroSection />
        <FeaturesSection />
        {/* Tu by mohla byť HowItWorksSection */}
        <CallToActionBottom />
      </main>
      {/* Footer tu nie je, predpokladá sa, že je v RootLayout alebo ho pridáš globálne */}
    </>
  );
}