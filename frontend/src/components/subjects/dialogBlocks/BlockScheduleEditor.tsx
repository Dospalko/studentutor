// frontend/src/components/subjects/dialogBlocks/BlockScheduleEditor.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Použi Label z shadcn
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker"; // Uprav cestu podľa tvojej štruktúry
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";

interface BlockScheduleEditorProps {
  initialScheduledAt: string | null | undefined;
  onSaveSchedule: (newDate: Date) => Promise<void>;
  isUpdating: boolean;
}

export default function BlockScheduleEditor({ initialScheduledAt, onSaveSchedule, isUpdating }: BlockScheduleEditorProps) {
  const [tempStart, setTempStart] = useState<Date | null>(null);

  useEffect(() => {
    setTempStart(initialScheduledAt ? new Date(initialScheduledAt) : null);
  }, [initialScheduledAt]);

  const handleSave = async () => {
    if (tempStart) {
      await onSaveSchedule(tempStart);
    }
  };

  const originalTime = initialScheduledAt ? new Date(initialScheduledAt).getTime() : null;
  const tempTime = tempStart ? tempStart.getTime() : null;
  const hasChanged = tempStart && (originalTime !== tempTime);

  return (
    <div className="space-y-2">
      <Label htmlFor="block-schedule-date-editor" className="text-sm font-medium flex items-center gap-2">
        <CalendarIcon className="h-4 w-4" />
        Naplánovať na
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button id="block-schedule-date-editor" variant="outline" className="w-full justify-start text-left font-normal">
            {tempStart ? tempStart.toLocaleString("sk-SK", { dateStyle: "medium", timeStyle: "short" }) : <span>Vyber dátum a čas</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={tempStart ?? undefined}
            onSelect={(date) => setTempStart(date ? new Date(date.setHours(tempStart?.getHours() ?? 0, tempStart?.getMinutes() ?? 0)) : null)}
            initialFocus
          />
          <div className="p-3 border-t border-border">
            <TimePicker date={tempStart} setDate={setTempStart} />
          </div>
        </PopoverContent>
      </Popover>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleSave}
        disabled={!tempStart || !hasChanged || isUpdating}
        className="mt-2"
      >
        {isUpdating && hasChanged && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {hasChanged ? "Uložiť Dátum/Čas" : "Dátum/Čas Uložený"}
      </Button>
    </div>
  );
}