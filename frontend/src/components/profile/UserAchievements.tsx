// frontend/src/components/profile/UserAchievements.tsx
"use client";

import { useEffect, useState, useContext } from 'react';
import { 
    Award, Star, Trophy, ShieldAlert, BookPlus, Library, CheckCircle, 
    GraduationCap, ListChecks, Loader2, Zap, RefreshCcw, FileArchive, 
    PieChart, Cog, Timer, Database, Edit3, BrainCog, Target // Pridané Edit3, BrainCog, Target
} from "lucide-react"; // Uisti sa, že máš všetky potrebné ikony
import { AuthContext } from '@/context/AuthContext';
import { Achievement, UserAchievement, getAllDefinedAchievements, getMyAchievements } from '@/services/achievementService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Rozšírený iconMap
const iconMap: { [key: string]: React.ElementType } = {
    BookPlus,       // Pre "Prvý Predmet"
    Library,        // Pre "Päť Predmetov"
    CheckCircle,    // Pre "Prvá Dokončená Téma"
    GraduationCap,  // Pre "Pilný Študent"
    ListChecks,     // Pre "Generátor Plánov"
    Zap,            // Pre "Organizátor" (predmet s 5 témami)
    RefreshCcw,     // Pre "Systematik" (5x generovaný/aktualizovaný plán)
    FileArchive,    // Pre "Knižný Mol" (3 materiály k predmetu)
    PieChart,       // Pre "Polčas Predmetu" (50% tém v predmete)
    Trophy,         // Pre "Predmet Zvládnutý!"
    Cog,            // Pre "Učebný Stroj" (25 dokončených blokov)
    Database,       // Pre "Vedomostná Zásoba" (10 nahraných materiálov)
    Timer,          // Pre "Pán Času" (ak by si ho implementoval)
    // Ikony pre kroky z HowItWorks, ak by si ich chcel použiť aj inde (alebo ich nechaj len tam)
    Edit3,          // Použité v HowItWorks
    BrainCog,       // Použité v HowItWorks
    Target,         // Použité v HowItWorks
    // Pôvodné defaultné ikony
    Award, 
    Star, 
    ShieldAlert,
};
// POMOCNÁ FUNKCIA PRE FORMÁTOVANIE ENUMOV
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value || typeof value !== 'string') return 'N/A'; // Pridaná kontrola pre null/undefined a typ
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

export default function UserAchievements() {
  const authContext = useContext(AuthContext);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [myAchievements, setMyAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authContext?.token) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        getAllDefinedAchievements(authContext.token),
        getMyAchievements(authContext.token)
      ]).then(([definedAch, userAch]) => {
        // Zoradenie definovaných achievementov podľa názvu
        setAllAchievements(definedAch.sort((a,b) => a.name.localeCompare(b.name)));
        setMyAchievements(userAch);
      }).catch(err => {
        console.error("Error fetching achievements:", err);
        setError((err as Error).message || "Nepodarilo sa načítať úspechy.");
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [authContext?.token]);

  if (isLoading) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          Moje Úspechy a Odznaky
        </h3>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="ml-2 text-muted-foreground text-sm">Načítavam úspechy...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // ... (kód pre error state zostáva rovnaký)
    return (
        <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Moje Úspechy a Odznaky
            </h3>
            <p className="text-sm text-destructive">{error}</p>
        </div>
    );
  }

  const myAchievementIds = new Set(myAchievements.map(ua => ua.achievement_id));

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
        Moje Úspechy a Odznaky
      </h3>
      {allAchievements.length === 0 && !isLoading && <p className="text-sm text-muted-foreground">Zatiaľ žiadne definované achievementy. Začni používať aplikáciu a sleduj, ako sa odomykajú!</p>}
      
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
        {allAchievements.map(achDef => {
          const achieved = myAchievementIds.has(achDef.id);
          const userAchInstance = achieved ? myAchievements.find(ua => ua.achievement_id === achDef.id) : undefined;
          // Ak icon_name nie je v mape, použi Star ako default
          const IconComponent = (achDef.icon_name && iconMap[achDef.icon_name]) ? iconMap[achDef.icon_name] : Star;

          return (
            <TooltipProvider key={achDef.id} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`flex flex-col items-center p-3 pt-4 border rounded-lg text-center transition-all aspect-square justify-center cursor-default
                                ${achieved 
                                  ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600 shadow-lg hover:shadow-amber-400/40 transform hover:scale-105' 
                                  : 'bg-slate-100 dark:bg-slate-800/60 border-dashed border-slate-300 dark:border-slate-700 opacity-60 hover:opacity-100 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
                                }`}
                  >
                    <div className={`mb-2 p-2.5 rounded-full 
                                    ${achieved 
                                      ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-sm' 
                                      : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
                                    }`}
                    >
                      <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${achieved ? '' : 'opacity-50'}`} />
                    </div>
                    <h4 className={`text-xs sm:text-sm font-medium leading-tight ${achieved ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'}`}>
                      {achDef.name}
                    </h4>
                    {achieved && userAchInstance && (
                        <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">
                            Získané!
                        </p>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-background text-foreground border shadow-xl">
                  <p className="font-semibold text-primary">{achDef.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{achDef.description}</p>
                  {achieved && userAchInstance && (
                     <p className="text-xs mt-2 pt-1 border-t border-border">Získané: {new Date(userAchInstance.achieved_at).toLocaleDateString('sk-SK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  )}
                  {!achieved && achDef.criteria_type && achDef.criteria_value && (
                     <p className="text-xs mt-2 pt-1 border-t border-border italic">Kritérium: {formatEnumValue(achDef.criteria_type)} ({achDef.criteria_value})</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      {allAchievements.length > 0 && <p className="text-xs text-muted-foreground mt-4 text-center">Prejdi myšou ponad odznak pre viac detailov.</p>}
    </div>
  );
}