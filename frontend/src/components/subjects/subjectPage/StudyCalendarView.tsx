/* ----------------------------------------------------------------------- */
/*  StudyCalendarView.tsx                                                  */
/*  – full, ready-to-paste file                                            */
/* ----------------------------------------------------------------------- */
"use client";

import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type DateLocalizer,
  type ViewsProps,
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
import type { Messages } from "react-big-calendar";

/* --------------------------------------------------------------------- */
/*  1.  date-fns localizer                                               */
/* --------------------------------------------------------------------- */
const locales = { "en-US": enUS };

const localizer: DateLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }), // Monday = 1
  getDay,
  locales,
});

/* --------------------------------------------------------------------- */
/*  2.  calendar event type                                              */
/* --------------------------------------------------------------------- */
export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: StudyBlock;
}

/* --------------------------------------------------------------------- */
/*  3.  component props                                                  */
/* --------------------------------------------------------------------- */
interface Props {
  studyPlan: { study_blocks: StudyBlock[] } | null;
  onSelectEvent?: (e: CalendarEvent) => void;
  onEventDrop?: (p: {
    event: CalendarEvent;
    start: Date;
    end: Date;
    allDay?: boolean;
  }) => Promise<void> | void;
  isUpdating?: boolean;
}

/* --------------------------------------------------------------------- */
/*  4.  helpers                                                          */
/* --------------------------------------------------------------------- */
const toDate = (val: Date | string) =>
  val instanceof Date ? val : new Date(val);

const prettifyEnum = (v?: string | null) =>
  v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

/* --------------------------------------------------------------------- */
/*  5.  DnD wrapper                                                      */
/* --------------------------------------------------------------------- */
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

/* --------------------------------------------------------------------- */
/*  6.  main component                                                   */
/* --------------------------------------------------------------------- */
export default function StudyCalendarView({
  studyPlan,
  onSelectEvent,
  onEventDrop,
  isUpdating,
}: Props) {
  /* ───────────────────────────── early exit ────────────────────────── */
  if (!studyPlan) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Žiadny študijný plán na zobrazenie v kalendári.
      </div>
    );
  }

  /* ───────────────────────────── data prep ─────────────────────────── */
  const events: CalendarEvent[] = studyPlan.study_blocks.map((b) => {
    const start = b.scheduled_at ? new Date(b.scheduled_at) : new Date();
    const end = new Date(start);
    end.setMinutes(
      start.getMinutes() + (b.duration_minutes ?? 60 /* default 1 h */)
    );

    return {
      id: b.id,
      title: b.topic.name,
      start,
      end,
      allDay:
        !b.duration_minutes &&
        (!b.scheduled_at || !b.scheduled_at.includes("T")),
      resource: b,
    };
  });

  /* ───────────────────────────── renderers ─────────────────────────── */
  const EventCell = ({ event }: { event: CalendarEvent }) => {
    const blk = event.resource!;
    return (
      <div className="p-0.5 text-xs h-full overflow-hidden">
        <strong>{event.title}</strong>
        <p className="truncate text-[0.65rem] leading-tight">
          {prettifyEnum(blk.status)}
        </p>
      </div>
    );
  };

  /* ───────────────────────────── dnd handler ───────────────────────── */
  /* ───────────────────────────── dnd handler ───────────────────────── */
  const handleDrop = async (args: {
    event: CalendarEvent;
    start: Date | string;
    end: Date | string;
    allDay?: boolean;
  }) => {
    await onEventDrop?.({
      event: args.event,
      start: toDate(args.start),
      end: toDate(args.end),
      allDay: args.allDay,
    });
  };
  /* ───────────────────────────── views & i18n ──────────────────────── */
  const views: ViewsProps<CalendarEvent> = {
    month: true,
    week: true,
    day: true,
    agenda: true,
  };
  const messages: Messages<CalendarEvent> = {
    month: "Mesiac",
    week: "Týždeň",
    day: "Deň",
    agenda: "Agenda",
    today: "Dnes",
    previous: "Späť",
    next: "Ďalej",
    noEventsInRange: "V tomto rozsahu nie sú žiadne udalosti.",
    showMore: (n: number) => `+ Zobraziť ďalších ${n}`,
  };

  /* ───────────────────────────── style picker ──────────────────────── */
  const eventStyleGetter = (
    evt: CalendarEvent,
    _start: Date,
    _end: Date,
    isSelected: boolean
  ) => {
    const blk = evt.resource!;
    const style: React.CSSProperties = {
      borderRadius: 3,
      borderWidth: 1,
      padding: "2px 4px",
      color: "white",
    };

    switch (blk.status) {
      case StudyBlockStatus.COMPLETED:
        Object.assign(style, {
          backgroundColor: "#34D399",
          borderColor: "#059669",
          color: "#064E3B",
        });
        break;
      case StudyBlockStatus.IN_PROGRESS:
        Object.assign(style, {
          backgroundColor: "#60A5FA",
          borderColor: "#2563EB",
        });
        break;
      case StudyBlockStatus.SKIPPED:
        Object.assign(style, {
          backgroundColor: "#F87171",
          borderColor: "#DC2626",
          opacity: 0.8,
        });
        break;
      default:
        Object.assign(style, {
          backgroundColor: "#A78BFA",
          borderColor: "#7C3AED",
        });
    }

    if (isSelected) {
      style.boxShadow = "0 0 0 2px hsl(var(--ring))";
      style.zIndex = 10;
    }

    return { style };
  };

  /* ───────────────────────────── render ────────────────────────────── */
  return (
    <div className="h-[600px] sm:h-[700px] p-1 bg-card shadow rounded-md relative">
      {isUpdating && (
        <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10 rounded-md">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <DnDCalendar
        localizer={localizer}
        events={events}
        views={views}
        defaultView={Views.MONTH}
        components={{ event: EventCell }}
        messages={messages}
        startAccessor="start"
        endAccessor="end"
        selectable
        draggableAccessor={() => true}
        onSelectEvent={onSelectEvent}
        onEventDrop={handleDrop}
        eventPropGetter={eventStyleGetter}
        style={{ height: "100%" }}
      />
    </div>
  );
}
/* ----------------------------------------------------------------------- */
