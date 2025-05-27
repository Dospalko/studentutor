// frontend/src/components/subjects/StudyCalendarView.tsx
"use client";

import { Calendar, dateFnsLocalizer, EventProps, Views, DateLocalizer } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import "react-big-calendar/lib/css/react-big-calendar.css";

import { StudyBlock, StudyPlan } from '@/services/studyPlanService';
import { StudyBlockStatus } from '@/types/study';
import { Loader2 } from 'lucide-react'; // Import Loader2

const locales = {
  'en-US': enUS,
};

const localizer: DateLocalizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
    getDay,
    locales,
});

export interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: StudyBlock;
}

interface StudyCalendarViewProps {
  studyPlan: StudyPlan | null;
  onSelectEvent?: (event: CalendarEvent) => void;
  onEventDrop?: (data: { event: CalendarEvent; start: Date; end: Date; allDay?: boolean }) => Promise<void> | void; // Ak budeš implementovať D&D
  isUpdating?: boolean; // <<<< TENTO PROP BOL PRIDANÝ
}

// Pomocná funkcia na formátovanie enum hodnôt
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};


export default function StudyCalendarView({
  studyPlan,
  onSelectEvent, // Pridaj aj onEventDrop do destrukturácie, ak ho budeš používať
  isUpdating // Použi tento prop
}: StudyCalendarViewProps) {
  if (!studyPlan) {
    return <div className="p-4 text-center text-muted-foreground">Žiadny študijný plán na zobrazenie v kalendári.</div>;
  }

  const events: CalendarEvent[] = studyPlan.study_blocks.map(block => {
    const startDate = block.scheduled_at ? new Date(block.scheduled_at) : new Date();
    const endDate = new Date(startDate); // Vytvor novú inštanciu Date

    if (block.duration_minutes) {
      endDate.setMinutes(startDate.getMinutes() + block.duration_minutes);
    } else {
      endDate.setHours(startDate.getHours() + 1);
    }

    return {
      id: block.id,
      title: block.topic.name,
      start: startDate,
      end: endDate,
      // Lepšia logika pre allDay: ak scheduled_at neobsahuje časovú zložku (je to len dátum)
      allDay: !block.duration_minutes && block.scheduled_at ? !block.scheduled_at.includes("T") : !block.duration_minutes,
      resource: block,
    };
  });
  
  const EventComponent = ({ event }: EventProps<CalendarEvent>) => {
    const block = event.resource;
    if (!block) return null; 
    // Farby sa teraz riešia cez eventPropGetter, toto môže byť jednoduchšie
    return (
      <div className="p-0.5 text-xs h-full overflow-hidden"> {/* Znížený padding pre viac textu */}
        <strong>{event.title}</strong>
        <p className="truncate text-[0.65rem] leading-tight">{formatEnumValue(block.status)}</p> {/* Menší text a riadkovanie */}
      </div>
    );
  };

  return (
    <div className="h-[600px] sm:h-[700px] p-1 bg-card shadow rounded-md relative"> {/* Pridané relative */}
      {isUpdating && ( // Overlay pre loading
        <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10 rounded-md">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <Calendar<CalendarEvent> // Explicitné typovanie pre Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        style={{ height: '100%' }}
        selectable
        onSelectEvent={onSelectEvent}                                   // lepšie je upraviť typ `onEventDrop` v propsoch
        components={{
            event: EventComponent, // Už nepotrebuješ as React.ComponentType...
        }}
        eventPropGetter={(event, start, end, isSelected) => {
            const newStyle: React.CSSProperties = {
                color: 'white', // Predvolená farba textu
                borderRadius: "3px",
                borderWidth: '1px',
                padding: '2px 4px', // Malý padding pre udalosť
            };
            const block = event.resource;
            if (block) { // Uisti sa, že block existuje
                if (block.status === StudyBlockStatus.COMPLETED) {
                    newStyle.backgroundColor = '#34D399'; // Tailwind green-400
                    newStyle.borderColor = '#059669';   // Tailwind green-600
                    newStyle.color = '#064E3B';         // Tailwind green-900 (tmavší text pre lepší kontrast)
                } else if (block.status === StudyBlockStatus.IN_PROGRESS) {
                    newStyle.backgroundColor = '#60A5FA'; // Tailwind blue-400
                    newStyle.borderColor = '#2563EB';   // Tailwind blue-600
                } else if (block.status === StudyBlockStatus.SKIPPED) {
                    newStyle.backgroundColor = '#F87171'; // Tailwind red-400
                    newStyle.borderColor = '#DC2626';   // Tailwind red-600
                    newStyle.opacity = 0.8;
                } else { // PLANNED alebo iné
                    newStyle.backgroundColor = '#A78BFA'; // Tailwind purple-400
                    newStyle.borderColor = '#7C3AED';   // Tailwind purple-600
                }
                if (isSelected) {
                    newStyle.boxShadow = '0 0 0 2px hsl(var(--ring))'; // Použi ring pre vybranú udalosť
                    newStyle.zIndex = 10; // Aby bola vybraná udalosť navrchu
                }
            }
            return { style: newStyle };
        }}
        messages={{ // Príklad lokalizácie textov v kalendári
            month: 'Mesiac',
            week: 'Týždeň',
            day: 'Deň',
            agenda: 'Agenda',
            today: 'Dnes',
            previous: 'Späť',
            next: 'Ďalej',
            noEventsInRange: 'V tomto rozsahu nie sú žiadne udalosti.',
            showMore: total => `+ Zobraziť ${total} ďalších`,
        }}
        // culture='sk-SK' // Odkomentuj, ak máš nastavenú slovenskú lokalizáciu pre date-fns
      />
    </div>
  );
}