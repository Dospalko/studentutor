// frontend/src/components/subjects/details/StudyPlanViewSwitch.tsx
"use client";

import { Switch } from "@/components/ui/switch";
import { Label as ShadcnLabel } from "@/components/ui/label";

interface StudyPlanViewSwitchProps {
  showCalendarView: boolean;
  onViewChange: (isCalendarView: boolean) => void;
}

export default function StudyPlanViewSwitch({ showCalendarView, onViewChange }: StudyPlanViewSwitchProps) {
  return (
    <div className="flex items-center space-x-2 order-last sm:order-none">
      <ShadcnLabel htmlFor="plan-view-switch" className="text-sm font-normal">Zoznam</ShadcnLabel>
      <Switch 
        id="plan-view-switch" 
        checked={showCalendarView} 
        onCheckedChange={onViewChange}
        aria-label="Prepnúť zobrazenie plánu"
      />
      <ShadcnLabel htmlFor="plan-view-switch" className="text-sm font-normal">Kalendár</ShadcnLabel>
    </div>
  );
}