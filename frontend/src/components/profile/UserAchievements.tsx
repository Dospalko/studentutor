// frontend/src/components/profile/UserAchievements.tsx
"use client";

import { Award, Star, Trophy, ShieldAlert } from "lucide-react"; // Príklady ikon

// Príklad štruktúry achievementu (zatiaľ len na frontende)
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  achieved: boolean; // Či ho užívateľ získal
  dateAchieved?: Date;
}

// Príklad dát (neskôr by prišli z backendu)
const exampleAchievements: Achievement[] = [
  { id: "1", name: "Prvý Predmet", description: "Vytvoril si svoj prvý študijný predmet.", icon: Award, achieved: true, dateAchieved: new Date(2023, 10, 15) },
  { id: "2", name: "Učenlivý Začiatočník", description: "Dokončil si 5 tém.", icon: Star, achieved: true, dateAchieved: new Date(2023, 11, 1) },
  { id: "3", name: "Majster Plánovania", description: "Vygeneroval si 3 študijné plány.", icon: Trophy, achieved: false },
  { id: "4", name: "Vytrvalec Týždňa", description: "Študoval si každý deň v týždni.", icon: ShieldAlert, achieved: false },
];


export default function UserAchievements() {
  // Neskôr: const [achievements, setAchievements] = useState<Achievement[]>([]);
  // useEffect na načítanie achievementov z backendu

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
        Moje Úspechy a Odznaky
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {exampleAchievements.map(ach => {
          const Icon = ach.icon;
          return (
            <div 
              key={ach.id} 
              className={`flex flex-col items-center p-4 border rounded-lg text-center transition-all
                          ${ach.achieved 
                            ? 'bg-amber-50 dark:bg-amber-800/30 border-amber-300 dark:border-amber-600 shadow-md' 
                            : 'bg-muted/30 dark:bg-slate-800/50 border-dashed opacity-60 hover:opacity-100 hover:bg-muted/50'
                          }`}
              title={ach.achieved && ach.dateAchieved ? `Získané: ${ach.dateAchieved.toLocaleDateString('sk-SK')}` : ach.description}
            >
              <div className={`mb-2 p-3 rounded-full 
                              ${ach.achieved 
                                ? 'bg-amber-400 text-white' 
                                : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
                              }`}
              >
                <Icon className={`h-7 w-7 ${ach.achieved ? '' : 'opacity-50'}`} />
              </div>
              <h4 className={`text-sm font-semibold ${ach.achieved ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'}`}>
                {ach.name}
              </h4>
              {ach.achieved && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                      {ach.description}
                  </p>
              )}
            </div>
          );
        })}
      </div>
       <p className="text-xs text-muted-foreground mt-4 text-center">
        Viac achievementov a odznakov bude pridaných čoskoro!
      </p>
    </div>
  );
}