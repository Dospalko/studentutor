"use client"

import type React from "react"

import Link from "next/link"
import { useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BookCheck,
  CalendarDays,
  BarChart3,
  Zap,
  Edit3,
  BrainCog,
  Target,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthContext } from "@/context/AuthContext"

export default function HomePage() {
  const authContext = useContext(AuthContext)
  const router = useRouter()

  useEffect(() => {
    if (authContext?.user && router && typeof window !== "undefined" && window.location.pathname !== "/dashboard") {
      router.push("/dashboard")
    }
  }, [authContext?.user, router])

  if (
    authContext?.isLoading ||
    (authContext?.user && typeof window !== "undefined" && window.location.pathname !== "/dashboard")
  ) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Načítavam aplikáciu...</p>
      </div>
    )
  }

  return (
    <main className="flex-grow bg-background">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CallToActionBottom />
      <footer className="py-8 text-center text-sm text-muted-foreground bg-muted">
        © {new Date().getFullYear()} TutorAI. Všetky práva vyhradené.
      </footer>
    </main>
  )
}

function HeroSection() {
  return (
    <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden">
      {/* Modern geometric background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.3),transparent_40%),radial-gradient(circle_at_bottom_left,hsl(var(--secondary)/0.2),transparent_40%)]"></div>

      {/* Floating elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto">
          <div className="flex-1 text-center lg:text-left">
            <Badge
              variant="outline"
              className="mb-6 px-4 py-1.5 text-sm font-medium border-primary/20 bg-primary/5 text-primary"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Nová generácia vzdelávania
            </Badge>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl leading-tight">
              Štúdium <span className="text-primary">Revolúcia.</span>
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                S Vašou AI.
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Premeňte chaos na prehľadný plán. Naša platforma s umelou inteligenciou vám pomôže nielen plánovať, ale
              skutočne rozumieť a napredovať.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 group">
                  Vyskúšať Zdarma
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/#howitworks">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Ako to funguje?
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-xl"></div>
              <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-3xl border border-muted"></div>
              <div className="relative h-full w-full p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    AI Asistent
                  </Badge>
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm">Aké témy by si chcel(a) dnes študovať?</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg ml-auto">
                    <p className="text-sm">Potrebujem sa naučiť lineárnu algebru na skúšku.</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm">Vytváram personalizovaný plán štúdia lineárnej algebry...</p>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
  className?: string
}

function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <Card
      className={`group h-full overflow-hidden border-muted/40 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 ${className}`}
    >
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-5 p-3 rounded-lg bg-primary/10 text-primary w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}

function FeaturesSection() {
  const features: FeatureCardProps[] = [
    {
      icon: BrainCog,
      title: "Inteligentné Plány",
      description:
        "AI analyzuje vaše silné a slabé stránky a vytvára študijný plán šitý na mieru vašim potrebám a cieľom.",
    },
    {
      icon: CalendarDays,
      title: "Interaktívny Kalendár",
      description:
        "Majte dokonalý prehľad o svojich študijných blokoch v intuitívnom kalendári s pripomienkami a notifikáciami.",
    },
    {
      icon: BarChart3,
      title: "Sledovanie Pokroku",
      description:
        "Vizualizujte svoj progres, sledujte dokončené témy a zostaňte neustále motivovaní vďaka prehľadným grafom.",
    },
    {
      icon: Zap,
      title: "Efektívne Učenie",
      description:
        "Zamerajte sa na oblasti, kde potrebujete najväčšie zlepšenie a učte sa efektívnejšie pomocou AI odporúčaní.",
    },
  ]

  return (
    <section id="features" className="w-full py-24 scroll-mt-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Funkcie
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Revolúcia vo Vašom Štúdiu</h2>
          <p className="text-muted-foreground">
            Objavte funkcie, ktoré vám pomôžu dosiahnuť akademický úspech bez zbytočného stresu a s radosťou z učenia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              className={`animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both`}
              style={{ animationDelay: `${index * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      icon: Edit3,
      title: "1. Zadefinujte Svoje Potreby",
      description: "Povedzte nám o predmete, vašich aktuálnych vedomostiach, silných a slabých stránkach.",
    },
    {
      icon: BrainCog,
      title: "2. AI Vytvorí Stratégiu",
      description: "Naša inteligentná platforma analyzuje vaše dáta a vygeneruje optimálny študijný plán.",
    },
    {
      icon: BookCheck,
      title: "3. Študujte s Prehľadom",
      description:
        "Sledujte svoj personalizovaný plán, využívajte interaktívny kalendár a sústreďte sa na to podstatné.",
    },
    {
      icon: Target,
      title: "4. Dosiahnite Výsledky",
      description: "Sledujte svoj pokrok, oslavujte úspechy a dosiahnite svoje akademické ciele s ľahkosťou.",
    },
  ]

  return (
    <section id="howitworks" className="w-full py-24 bg-muted/50 scroll-mt-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Proces
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Ako To Funguje?</h2>
          <p className="text-muted-foreground">Začať je jednoduché. Sledujte tieto kroky k úspešnému štúdiu.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col items-center text-center relative"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Connecting line - only show between steps on large screens */}
              {index < steps.length - 1 && (
                <div
                  className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/20 hidden lg:block z-0"
                  style={{ transform: "translateX(50%)" }}
                ></div>
              )}

              <div className="mb-6 flex items-center justify-center h-16 w-16 rounded-full bg-background border-4 border-primary/20 relative z-10 shadow-lg">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground max-w-xs">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "Vďaka TutorAI som zlepšil svoje známky o celý stupeň. Personalizovaný plán štúdia mi pomohol sústrediť sa na oblasti, kde som najviac zaostával.",
      author: "Michal K.",
      role: "Študent informatiky",
    },
    {
      quote:
        "Konečne som našla systém, ktorý mi pomáha organizovať moje štúdium efektívne. AI asistent mi ušetril hodiny plánovania.",
      author: "Lucia M.",
      role: "Študentka medicíny",
    },
    {
      quote:
        "Ako učiteľ oceňujem, ako TutorAI pomáha mojim študentom. Vidím výrazné zlepšenie v ich príprave a výsledkoch.",
      author: "Prof. Novák",
      role: "Vysokoškolský pedagóg",
    },
  ]

  return (
    <section className="w-full py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-xl mx-auto text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Referencie
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Čo Hovoria Naši Používatelia</h2>
          <p className="text-muted-foreground">
            Prečítajte si skúsenosti študentov a pedagógov, ktorí už využívajú našu platformu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-muted/30 border-muted/40">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="mb-4 text-primary">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="inline-block mr-1">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-foreground italic mb-6 flex-1">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function CallToActionBottom() {
  return (
    <section className="w-full py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-background to-secondary/20"></div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 border-primary/20 bg-primary/5 text-primary">
            <Sparkles className="mr-2 h-4 w-4" />
            Začnite už dnes
          </Badge>

          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">Pripravení Zmeniť Svoje Štúdium?</h2>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Pridajte sa k študentom, ktorí transformujú svoje učenie. Vytvorte si účet zdarma a objavte silu
            personalizovaného štúdia ešte dnes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 group">
                Začať Teraz Zdarma
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Viac Informácií
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
