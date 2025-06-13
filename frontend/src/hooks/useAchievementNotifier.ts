// frontend/src/hooks/useAchievementNotifier.ts
import React, { useEffect, useState, useContext, useCallback } from 'react'; // Pridaný ReactElement
import { toast } from "sonner";
import { AuthContext } from '@/context/AuthContext';
import { UserAchievement, getMyAchievements } from '@/services/achievementService'; 
   
import { 
    Award, Star, Trophy, ShieldAlert, BookPlus, Library, CheckCircle, 
    GraduationCap, ListChecks, Zap, RefreshCcw, FileArchive, 
    PieChart, Cog, Timer, Database, Edit3, BrainCog, Target
} from "lucide-react";

const ICON_MAP_DEFINITION: { [key: string]: React.ElementType } = {
    BookPlus, Library, CheckCircle, GraduationCap, ListChecks, Zap, RefreshCcw,
    FileArchive, PieChart, Trophy, Cog, Timer, Database, Edit3, BrainCog, Target,
    Award, Star, ShieldAlert,
};

export function useAchievementNotifier() {
    const authContext = useContext(AuthContext);
    const [previousUserAchievements, setPreviousUserAchievements] = useState<UserAchievement[]>([]);
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

    const initializeAchievements = useCallback(async () => {
        if (authContext?.token) {
            try {
                console.log("[Notifier] Initializing achievements...");
                const myAch = await getMyAchievements(authContext.token);
                setPreviousUserAchievements(myAch);
                setIsInitialLoadComplete(true);
                console.log("[Notifier] Initial achievements loaded:", myAch.length);
            } catch (error) {
                console.error("[Notifier] Error initializing achievements:", error);
                setIsInitialLoadComplete(true); 
            }
        }
    }, [authContext?.token]);

    useEffect(() => {
        initializeAchievements();
    }, [initializeAchievements]);

    const checkForNewAchievements = useCallback(async () => {
        if (!authContext?.token || !isInitialLoadComplete) {
            if (!isInitialLoadComplete && authContext?.token) {
                console.log("[Notifier] Waiting for initial achievement load before checking for new ones.");
            }
            return;
        }

        console.log("[Notifier] Checking for new achievements...");
        try {
            const currentUserAchievements = await getMyAchievements(authContext.token);
            console.log("[Notifier] Current achievements:", currentUserAchievements.length, "Previous:", previousUserAchievements.length);

            const previousAchIds = new Set(previousUserAchievements.map(ua => ua.achievement_id));
            
            currentUserAchievements.forEach(currentUserAch => {
                if (!previousAchIds.has(currentUserAch.achievement_id)) {
                    const achievementDetail = currentUserAch.achievement;
                    
                    const ResolvedIcon = (achievementDetail.icon_name && ICON_MAP_DEFINITION[achievementDetail.icon_name]) 
                                          ? ICON_MAP_DEFINITION[achievementDetail.icon_name] 
                                          : Star; 
                    
                    console.log(`[Notifier] New achievement earned: ${achievementDetail.name}`);
                    toast.success(`Nový úspech: ${achievementDetail.name}!`, {
                        description: achievementDetail.description,
                        icon: React.createElement(ResolvedIcon, { className: "h-5 w-5" }), // Použi ResolvedIcon správne
                        duration: 7000,
                      });
                }
            });
            setPreviousUserAchievements(currentUserAchievements);
        } catch (error) {
            console.error("[Notifier] Failed to check for new achievements:", error);
        }
    }, [authContext?.token, previousUserAchievements, isInitialLoadComplete]);
       
    return checkForNewAchievements;
}