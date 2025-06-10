// frontend/src/components/profile/UserAchievements.tsx
"use client";

import { useEffect, useState, useContext } from 'react';
import { Award, Star, Trophy, ShieldAlert, BookPlus, Library, CheckCircle, GraduationCap, ListChecks, Loader2 } from "lucide-react";
import { AuthContext } from '@/context/AuthContext';
import { Achievement, UserAchievement, getAllDefinedAchievements, getMyAchievements } from '@/services/achievementService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Mapovanie názvov ikon na komponenty ikon
const iconMap: { [key: string]: React.ElementType } = {
    BookPlus, Library, CheckCircle, GraduationCap, ListChecks,
    Award, Star, Trophy, ShieldAlert, // Default ikony, ak icon_name nie je špecifikovaný
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
        setAllAchievements(definedAch.sort((a,b) => a.name.localeCompare(b.name)));
        setMyAchievements(userAch);
      }).catch(err => {
        console.error("Error fetching achievements:", err);
        setError("Nepodarilo sa načítať úspechy.");
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
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const myAchievementIds = new Set(myAchievements.map(ua => ua.achievement_id));

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
        Moje Úspechy a Odznaky
      </h3>
      {allAchievements.length === 0 && <p className="text-sm text-muted-foreground">Zatiaľ žiadne definované achievementy.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {allAchievements.map(achDef => {
          const achieved = myAchievementIds.has(achDef.id);
          const userAchInstance = achieved ? myAchievements.find(ua => ua.achievement_id === achDef.id) : undefined;
          const IconComponent = achDef.icon_name ? iconMap[achDef.icon_name] || Star : Star; // Default ikona

          return (
            <TooltipProvider key={achDef.id} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`flex flex-col items-center p-3 pt-4 border rounded-lg text-center transition-all aspect-square justify-center
                                ${achieved 
                                  ? 'bg-amber-50 dark:bg-amber-800/30 border-amber-400 dark:border-amber-600 shadow-lg hover:shadow-amber-400/30' 
                                  : 'bg-slate-100 dark:bg-slate-800/50 border-dashed opacity-60 hover:opacity-100 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
                                }`}
                  >
                    <div className={`mb-2 p-2.5 rounded-full 
                                    ${achieved 
                                      ? 'bg-amber-500 text-white' 
                                      : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
                                    }`}
                    >
                      <IconComponent className={`h-6 w-6 ${achieved ? '' : 'opacity-50'}`} />
                    </div>
                    <h4 className={`text-xs sm:text-sm font-semibold ${achieved ? 'text-amber-700 dark:text-amber-200' : 'text-muted-foreground'}`}>
                      {achDef.name}
                    </h4>
                    {achieved && userAchInstance && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            Získané!
                        </p>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold">{achDef.name}</p>
                  <p className="text-xs text-muted-foreground">{achDef.description}</p>
                  {achieved && userAchInstance && (
                     <p className="text-xs mt-1">Získané: {new Date(userAchInstance.achieved_at).toLocaleDateString('sk-SK')}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      {allAchievements.length > 0 && <p className="text-xs text-muted-foreground mt-4 text-center">Prejdi myšou pre detail.</p>}
    </div>
  );
}