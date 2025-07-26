"use client"

import { Calendar, Views, dateFnsLocalizer, type DateLocalizer, type Event, type View } from "react-big-calendar"
import withDragAndDrop, { type EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"
import { format, parse, startOfWeek, getDay, addMinutes } from "date-fns"
import { enUS } from "date-fns/locale"
import { useMemo, useState, type CSSProperties } from "react"
import { Loader2, CalendarIcon, Clock, Target } from "lucide-react"
import type { StudyBlock } from "@/services/studyPlanService"
import { StudyBlockStatus } from "@/types/study"

/* --------------------------------------------------------------------- */
/*  localizer – date-fns                                                 */
/* --------------------------------------------------------------------- */
const locales = { "en-US": enUS }
const localizer: DateLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales,
})

/* --------------------------------------------------------------------- */
/*  public typ – event ktorý dostáva rodič                               */
/* --------------------------------------------------------------------- */
export interface CalendarEvent extends Event {
  id: number
  title: string
  start: Date
  end: Date
  resource?: StudyBlock
}

/* --------------------------------------------------------------------- */
/*  props                                                                */
/* --------------------------------------------------------------------- */
interface Props {
  studyPlan: { study_blocks: StudyBlock[] } | null
  onSelectEvent?: (e: CalendarEvent) => void
  onEventDrop?: (args: {
    event: CalendarEvent
    start: Date
    end: Date
  }) => void | Promise<void>
  isUpdating?: boolean
}

/* --------------------------------------------------------------------- */
/*  DnD wrapper                                                          */
/* --------------------------------------------------------------------- */
const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar)

/* --------------------------------------------------------------------- */
/*  komponent                                                             */
/* --------------------------------------------------------------------- */
export default function StudyCalendarView({ studyPlan, onSelectEvent, onEventDrop, isUpdating }: Props) {
  /* ------------------------------------------------------------------ */
  /*  2) controlled navigácia – dátum + view                            */
  /* ------------------------------------------------------------------ */
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentView, setCurrentView] = useState<View>(Views.MONTH as View)

  /* ------------------------------------------------------------------ */
  /*  3) prevod blokov → udalosti                                       */
  /* ------------------------------------------------------------------ */
  const events: CalendarEvent[] = useMemo(
    () =>
      studyPlan?.study_blocks
        ? studyPlan.study_blocks.map((b) => {
            const start = b.scheduled_at ? new Date(b.scheduled_at) : new Date()
            const end = addMinutes(start, b.duration_minutes ?? 60)
            return {
              id: b.id,
              title: b.topic.name,
              start,
              end,
              allDay: !b.duration_minutes,
              resource: b,
            }
          })
        : [],
    [studyPlan?.study_blocks],
  )

  /* ------------------------------------------------------------------ */
  /*  1) fallback – nemáme nič na zobrazenie                            */
  /* ------------------------------------------------------------------ */
  if (!studyPlan) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/25">
        <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
          <CalendarIcon className="h-12 w-12" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Žiadny študijný plán</h3>
        <p className="text-muted-foreground max-w-md">
          Vytvorte si študijný plán, aby ste mohli vidieť svoje bloky v kalendári.
        </p>
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /*  4) drag-and-drop handler                                          */
  /* ------------------------------------------------------------------ */
  const handleDrop = async (args: EventInteractionArgs<CalendarEvent>) => {
    const start = args.start instanceof Date ? args.start : new Date(args.start)
    const end = args.end instanceof Date ? args.end : new Date(args.end)
    await onEventDrop?.({ event: args.event, start, end })
  }

  /* ------------------------------------------------------------------ */
  /*  5) renderer + farby                                               */
  /* ------------------------------------------------------------------ */
  const EventCell = ({ event }: { event: CalendarEvent }) => (
    <div className="p-1 text-xs h-full overflow-hidden group">
      <div className="flex items-center gap-1 mb-1">
        <Target className="h-3 w-3 flex-shrink-0" />
        <strong className="truncate text-white">{event.title}</strong>
      </div>
      <div className="flex items-center gap-1 opacity-90">
        <Clock className="h-2.5 w-2.5 flex-shrink-0" />
        <span className="text-[0.65rem] leading-tight capitalize">
          {event.resource?.status.replace(/_/g, " ").toLowerCase()}
        </span>
      </div>
    </div>
  )

  const eventPropGetter = (event: CalendarEvent, _s: Date, _e: Date, isSel: boolean) => {
    const style: CSSProperties = {
      borderRadius: 8,
      borderWidth: 2,
      padding: "4px 8px",
      fontSize: "12px",
      fontWeight: "500",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      transition: "all 0.2s ease",
    }

    switch (event.resource?.status) {
      case StudyBlockStatus.COMPLETED:
        style.background = "linear-gradient(135deg, #10B981 0%, #059669 100%)"
        style.borderColor = "#047857"
        style.color = "white"
        break
      case StudyBlockStatus.IN_PROGRESS:
        style.background = "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
        style.borderColor = "#1D4ED8"
        style.color = "white"
        break
      case StudyBlockStatus.SKIPPED:
        style.background = "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
        style.borderColor = "#B91C1C"
        style.color = "white"
        style.opacity = 0.9
        break
      default:
        style.background = "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)"
        style.borderColor = "#6D28D9"
        style.color = "white"
    }

    if (isSel) {
      style.boxShadow = "0 0 0 3px hsl(var(--ring)), 0 4px 8px rgba(0,0,0,0.2)"
      style.zIndex = 10
      style.transform = "scale(1.02)"
    }

    return { style }
  }

  /* ------------------------------------------------------------------ */
  /*  6) render                                                          */
  /* ------------------------------------------------------------------ */
  return (
    <div className="relative">
      {/* Calendar Container */}
      <div className="h-[600px] sm:h-[700px] p-4 bg-card shadow-lg rounded-xl border border-muted/40 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/2 via-transparent to-secondary/2 pointer-events-none" />

        {/* Loader Overlay */}
        {isUpdating && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
            <div className="flex flex-col items-center gap-3 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="font-medium">Aktualizujem plán...</span>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="relative h-full">
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
            components={{
              event: EventCell,
            }}
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
            className="modern-calendar"
          />
        </div>
      </div>

      {/* Custom Calendar Styles */}
      <style jsx global>{`
        .modern-calendar .rbc-calendar {
          font-family: inherit;
        }
        
        .modern-calendar .rbc-header {
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary))/80% 100%);
          color: white;
          font-weight: 600;
          padding: 12px 8px;
          border: none;
          text-align: center;
        }
        
        .modern-calendar .rbc-month-view,
        .modern-calendar .rbc-time-view {
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          overflow: hidden;
        }
        
        .modern-calendar .rbc-date-cell {
          padding: 8px;
          text-align: center;
        }
        
        .modern-calendar .rbc-today {
          background-color: hsl(var(--primary))/10%;
        }
        
        .modern-calendar .rbc-toolbar {
          margin-bottom: 16px;
          padding: 0;
        }
        
        .modern-calendar .rbc-toolbar button {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .modern-calendar .rbc-toolbar button:hover {
          background: hsl(var(--muted));
          border-color: hsl(var(--primary));
        }
        
        .modern-calendar .rbc-toolbar button.rbc-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }
      `}</style>
    </div>
  )
}
