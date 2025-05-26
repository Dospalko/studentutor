// frontend/src/components/subjects/StudyCalendarView.tsx
"use client";

import { Calendar, dateFnsLocalizer, EventProps, Views, DateLocalizer } from 'react-big-calendar';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US'; // Alebo skSVK ak máš lokalizačný súbor
import "react-big-calendar/lib/css/react-big-calendar.css";

import { StudyBlock, StudyPlan } from '@/services/studyPlanService'; // Importuj tvoje typy
import { StudyBlockStatus } from '@/types/study'; // Importuj enum

// Nastavenie lokalizácie pre date-fns
const locales = {
  'en-US': enUS,
  // 'sk-SK': require('date-fns/locale/sk') // Ak chceš slovenčinu, nainštaluj a importuj
};


const localizer: DateLocalizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }), // Pondelok ako prvý deň týždňa
    getDay,
    locales,
});

// Definícia typu pre udalosti v kalendári
interface CalendarEvent {
  id: number; // ID študijného bloku
  title: string; // Názov témy
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: StudyBlock; // Pôvodný objekt StudyBlock pre ďalšie dáta
}

interface StudyCalendarViewProps {
  studyPlan: StudyPlan | null;
  onSelectEvent?: (event: CalendarEvent) => void; // Pre kliknutie na udalosť
  // onSelectSlot?: (slotInfo: { start: Date, end: Date, slots: Date[] | string[], action: 'select' | 'click' | 'doubleClick' }) => void; // Pre kliknutie na prázdny slot
  // onEventDrop?: (data: { event: CalendarEvent, start: Date, end: Date, allDay: boolean }) => void; // Pre drag-and-drop
}

export default function StudyCalendarView({
  studyPlan,
  onSelectEvent,
  // onSelectSlot,
  // onEventDrop,
}: StudyCalendarViewProps) {
  if (!studyPlan) {
    return <div className="p-4 text-center text-muted-foreground">Žiadny študijný plán na zobrazenie v kalendári.</div>;
  }

  // Transformácia StudyBlockov na udalosti pre kalendár
  const events: CalendarEvent[] = studyPlan.study_blocks.map(block => {
    const startDate = block.scheduled_at ? new Date(block.scheduled_at) : new Date(); // Fallback na dnešok
    const endDate = new Date(startDate);

    if (block.duration_minutes) {
      endDate.setMinutes(startDate.getMinutes() + block.duration_minutes);
    } else {
      // Ak nie je trvanie, urobme to ako celodennú udalosť alebo hodinovú udalosť
      endDate.setHours(startDate.getHours() + 1); // Napr. default 1 hodina
    }

    return {
      id: block.id,
      title: block.topic.name,
      start: startDate,
      end: endDate,
      allDay: !block.duration_minutes, // Ak nie je duration, považuj za allDay (môžeš zmeniť)
      resource: block, // Uložíme si celý objekt bloku
    };
  });
  
  // Vlastný komponent pre udalosť (voliteľné, na štylovanie)
  const EventComponent = ({ event }: EventProps<CalendarEvent>) => {
    const block = event.resource as StudyBlock;
    let bgColor = 'bg-blue-500'; // Default pre PLANNED
    if (block.status === StudyBlockStatus.COMPLETED) bgColor = 'bg-green-500';
    if (block.status === StudyBlockStatus.SKIPPED) bgColor = 'bg-red-500 opacity-70';
    if (block.status === StudyBlockStatus.IN_PROGRESS) bgColor = 'bg-yellow-500';

    return (
      <div className={`p-1 text-white rounded-sm text-xs h-full ${bgColor}`}>
        <strong>{event.title}</strong>
        {/* Môžeš pridať čas alebo iné info */}
        <p className="truncate">{block.status ? formatEnumValue(block.status) : ''}</p>
      </div>
    );
  };


  return (
    <div className="h-[600px] p-1 bg-card shadow rounded-md"> {/* Výška je dôležitá pre kalendár */}
      <Calendar<CalendarEvent>
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH} // Alebo Views.WEEK, Views.DAY, Views.AGENDA
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        style={{ height: '100%' }}
        selectable // Umožní vyberať sloty (pre onSelectSlot)
        onSelectEvent={onSelectEvent} // Handler pre kliknutie na existujúcu udalosť
        // onSelectSlot={onSelectSlot} // Handler pre výber prázdneho slotu
        // draggableAccessor={() => true} // Vždy povoľ drag
        // onEventDrop={onEventDrop} // Handler pre drag & drop
        components={{
            event: EventComponent as React.ComponentType<EventProps<CalendarEvent>>, // Použitie vlastného komponentu pre udalosť
        }}
        eventPropGetter={(
            event: CalendarEvent, 
        ): {
            className?: string;
            style?: React.CSSProperties;
        } => {
            // Tu môžeš dynamicky meniť štýl udalostí na základe ich vlastností
            const newStyle: React.CSSProperties = {
                // backgroundColor: "lightgrey",
                // color: 'black',
                // borderRadius: "0px",
                // border: "none"
            };
            const block = event.resource as StudyBlock;
            if (block.status === StudyBlockStatus.COMPLETED) {
                newStyle.backgroundColor = '#4ade80'; // Zelená
                newStyle.borderColor = '#22c55e';
            } else if (block.status === StudyBlockStatus.IN_PROGRESS) {
                newStyle.backgroundColor = '#60a5fa'; // Modrá
                newStyle.borderColor = '#2563eb';
            } else if (block.status === StudyBlockStatus.SKIPPED) {
                newStyle.backgroundColor = '#f87171'; // Červená
                newStyle.borderColor = '#dc2626';
                newStyle.opacity = 0.7;
            } else { // PLANNED
                newStyle.backgroundColor = '#a78bfa'; // Fialová
                newStyle.borderColor = '#7c3aed';
            }
            return {
                className: "", // Môžeš pridať Tailwind triedy
                style: newStyle
            };
        }}
      />
    </div>
  );
}

// Pomocná funkcia na formátovanie enum hodnôt, ak ju potrebuješ aj tu
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};