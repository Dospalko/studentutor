"use client";

import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type DateLocalizer,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { enUS } from "date-fns/locale/en-US";

import { StudyBlock } from "@/services/studyPlanService";
import { StudyBlockStatus } from "@/types/study";
import { Loader2 } from "lucide-react";

/* ---------- Lokálna konfigurácia date-fns ---------- */
const locales = { "en-US": enUS };

const localizer: DateLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

/* ---------- Typ eventu posielaného do kalendára ---------- */
export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: StudyBlock;
}

/* ---------- Props pre komponent ---------- */
interface StudyCalendarViewProps {
  studyPlan: { study_blocks: StudyBlock[] } | null;
  onSelectEvent?: (event: CalendarEvent) => void;
  onEventDrop?: (data: {
    event: CalendarEvent;
    start: Date;
    end: Date;
    allDay?: boolean;
  }) => Promise<void> | void;
  isUpdating?: boolean;
}

/* ---------- Pomocné – formát ENUM hodnôt ---------- */
const formatEnumValue = (value: string | undefined | null): string => {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

/* ---------- Drag-and-Drop verzia kalendára ---------- */
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

/* -------------------------------------------------------------------------- */
/*                                     View                                   */
/* -------------------------------------------------------------------------- */
export default function StudyCalendarView({
  studyPlan,
  onSelectEvent,
  onEventDrop,
  isUpdating,
}: StudyCalendarViewProps) {
  /* Ak nemáme plán, zobrazíme info a končíme */
  if (!studyPlan) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Žiadny študijný plán na zobrazenie v kalendári.
      </div>
    );
  }

  /* ---------- Konverzia StudyBlock → CalendarEvent ---------- */
  const events: CalendarEvent[] = studyPlan.study_blocks.map((block) => {
    const startDate = block.scheduled_at ? new Date(block.scheduled_at) : new Date();
    const endDate = new Date(startDate);

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
      allDay:
        !block.duration_minutes && block.scheduled_at
          ? !block.scheduled_at.includes("T")
          : !block.duration_minutes,
      resource: block,
    };
  });

  /* ---------- Vlastný render bunky udalosti ---------- */
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const block = event.resource;
    if (!block) return null;
    return (
      <div className="p-0.5 text-xs h-full overflow-hidden">
        <strong>{event.title}</strong>
        <p className="truncate text-[0.65rem] leading-tight">
          {formatEnumValue(block.status)}
        </p>
      </div>
    );
  };

  /* ---------- Handler pre presun udalosti ---------- */
  const handleEventDrop = async (args: {
    event: CalendarEvent;
    start: string | Date;
    end: string | Date;
    allDay?: boolean;
  }) => {
    // Convert string dates to Date objects if needed
    const start = args.start instanceof Date ? args.start : new Date(args.start);
    const end = args.end instanceof Date ? args.end : new Date(args.end);
    
    await onEventDrop?.({
      event: args.event,
      start,
      end,
      allDay: args.allDay
    }); // Callback do rodiča
  };

  return (
    <div className="h-[600px] sm:h-[700px] p-1 bg-card shadow rounded-md relative">
      {/* Loading overlay */}
      {isUpdating && (
        <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10 rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        style={{ height: "100%" }}
        selectable
        onSelectEvent={onSelectEvent}
        onEventDrop={handleEventDrop}
        draggableAccessor={() => true}
        components={{ event: EventComponent }}
        eventPropGetter={(event, _start, _end, isSelected) => {
          /* ---------- Dynamická farba podľa statusu ---------- */
          const style: React.CSSProperties = {
            color: "white",
            borderRadius: "3px",
            borderWidth: "1px",
            padding: "2px 4px",
          };
          const block = event.resource;
          if (block) {
            switch (block.status) {
              case StudyBlockStatus.COMPLETED:
                style.backgroundColor = "#34D399";
                style.borderColor = "#059669";
                style.color = "#064E3B";
                break;
              case StudyBlockStatus.IN_PROGRESS:
                style.backgroundColor = "#60A5FA";
                style.borderColor = "#2563EB";
                break;
              case StudyBlockStatus.SKIPPED:
                style.backgroundColor = "#F87171";
                style.borderColor = "#DC2626";
                style.opacity = 0.8;
                break;
              default:
                style.backgroundColor = "#A78BFA";
                style.borderColor = "#7C3AED";
            }
            if (isSelected) {
              style.boxShadow = "0 0 0 2px hsl(var(--ring))";
              style.zIndex = 10;
            }
          }
          return { style };
        }}
        messages={{
          month: "Mesiac",
          week: "Týždeň",
          day: "Deň",
          agenda: "Agenda",
          today: "Dnes",
          previous: "Späť",
          next: "Ďalej",
          noEventsInRange: "V tomto rozsahu nie sú žiadne udalosti.",
          showMore: (total) => `+ Zobraziť ${total} ďalších`,
        }}
      />
    </div>
  );
}
