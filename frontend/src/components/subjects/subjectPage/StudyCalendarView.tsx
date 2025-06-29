/* ----------------------------------------------------------------------- */
/*  StudyCalendarView.tsx                                                  */
/* ----------------------------------------------------------------------- */
"use client";

import {
  Calendar,
  Views,
  dateFnsLocalizer,
  type DateLocalizer,
  type Event,
  type View,          //  ←  ⬅  DOPLNENÉ
} from "react-big-calendar";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

import { format, parse, startOfWeek, getDay, addMinutes } from "date-fns";
import { enUS } from "date-fns/locale";
import { useMemo, useState, type CSSProperties } from "react";
import { Loader2 } from "lucide-react";

import { StudyBlock } from "@/services/studyPlanService";
import { StudyBlockStatus } from "@/types/study";

/* --------------------------------------------------------------------- */
/*  localizer – date-fns                                                 */
/* --------------------------------------------------------------------- */
const locales = { "en-US": enUS };

const localizer: DateLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales,
});

/* --------------------------------------------------------------------- */
/*  public typ – event ktorý dostáva rodič                               */
/* --------------------------------------------------------------------- */
export interface CalendarEvent extends Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource?: StudyBlock;
}

/* --------------------------------------------------------------------- */
/*  props                                                                */
/* --------------------------------------------------------------------- */
interface Props {
  studyPlan: { study_blocks: StudyBlock[] } | null;
  onSelectEvent?: (e: CalendarEvent) => void;
  onEventDrop?: (args: {
    event: CalendarEvent;
    start: Date;
    end: Date;
  }) => void | Promise<void>;
  isUpdating?: boolean;
}

/* --------------------------------------------------------------------- */
/*  DnD wrapper                                                          */
/* --------------------------------------------------------------------- */
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

/* --------------------------------------------------------------------- */
/*  komponent                                                             */
/* --------------------------------------------------------------------- */
export default function StudyCalendarView({
  studyPlan,
  onSelectEvent,
  onEventDrop,
  isUpdating,
}: Props) {
  /* ------------------------------------------------------------------ */
  /*  2) controlled navigácia – dátum + view                            */
  /* ------------------------------------------------------------------ */
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>(Views.MONTH as View);

  /* ------------------------------------------------------------------ */
  /*  1) fallback – nemáme nič na zobrazenie                            */
  /* ------------------------------------------------------------------ */
  if (!studyPlan) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Žiadny študijný plán na zobrazenie v kalendári.
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  3) prevod blokov → udalosti                                       */
  /* ------------------------------------------------------------------ */
  const events: CalendarEvent[] = useMemo(
    () =>
      studyPlan.study_blocks.map((b) => {
        const start = b.scheduled_at ? new Date(b.scheduled_at) : new Date();
        const end = addMinutes(start, b.duration_minutes ?? 60);

        return {
          id: b.id,
          title: b.topic.name,
          start,
          end,
          allDay: !b.duration_minutes,
          resource: b,
        };
      }),
    [studyPlan.study_blocks]
  );

  /* ------------------------------------------------------------------ */
  /*  4) drag-and-drop handler                                          */
  /* ------------------------------------------------------------------ */
  const handleDrop = async (args: EventInteractionArgs<CalendarEvent>) => {
    const start = args.start instanceof Date ? args.start : new Date(args.start);
    const end = args.end instanceof Date ? args.end : new Date(args.end);
    await onEventDrop?.({ event: args.event, start, end });
  };

  /* ------------------------------------------------------------------ */
  /*  5) renderer + farby                                               */
  /* ------------------------------------------------------------------ */
  const EventCell = ({ event }: { event: CalendarEvent }) => (
    <div className="p-0.5 text-xs h-full overflow-hidden">
      <strong>{event.title}</strong>
      <p className="truncate text-[0.65rem] leading-tight">
        {event.resource?.status.replace(/_/g, " ").toLowerCase()}
      </p>
    </div>
  );

  const eventPropGetter = (
    event: CalendarEvent,
    _s: Date,
    _e: Date,
    isSel: boolean
  ) => {
    const style: CSSProperties = {
      color: "white",
      borderRadius: 3,
      borderWidth: 1,
      padding: "2px 4px",
    };

    switch (event.resource?.status) {
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
        style.opacity = 0.85;
        break;
      default:
        style.backgroundColor = "#A78BFA";
        style.borderColor = "#7C3AED";
    }

    if (isSel) {
      style.boxShadow = "0 0 0 2px hsl(var(--ring))";
      style.zIndex = 10;
    }
    return { style };
  };

  /* ------------------------------------------------------------------ */
  /*  6) render                                                          */
  /* ------------------------------------------------------------------ */
  return (
    <div className="h-[600px] sm:h-[700px] p-1 bg-card shadow rounded-md relative">
      {/* loader cez celý kalendár */}
      {isUpdating && (
        <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10 rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <DnDCalendar
        /* --- controlled navigácia & view ----------------- */
        date={currentDate}
        view={currentView}
        onNavigate={setCurrentDate}
        onView={(v) => setCurrentView(v)}
        /* -------------------------------------------------- */
        localizer={localizer}
        events={events}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        startAccessor="start"
        endAccessor="end"
        selectable
        draggableAccessor={() => true}
        onEventDrop={handleDrop}
        onSelectEvent={onSelectEvent}
        components={{ event: EventCell }}
        eventPropGetter={eventPropGetter}
        style={{ height: "100%" }}
        messages={{
          month: "Mesiac",
          week: "Týždeň",
          day: "Deň",
          agenda: "Agenda",
          today: "Dnes",
          previous: "Späť",
          next: "Ďalej",
          noEventsInRange: "V tomto rozsahu nie sú žiadne udalosti.",
          showMore: (t) => `+ Zobraziť ${t} ďalších`,
        }}
      />
    </div>
  );
}
/* ----------------------------------------------------------------------- */
