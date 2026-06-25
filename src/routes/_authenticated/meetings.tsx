import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Link2, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "scheduled", label: "מתוכננת" },
  { value: "completed", label: "הושלמה" },
  { value: "cancelled", label: "בוטלה" },
];
const statusTone: Record<string, any> = { scheduled: "cyan", completed: "emerald", cancelled: "red" };
const statusLabel: Record<string, string> = Object.fromEntries(statusOptions.map((s) => [s.value, s.label]));

const fields: FieldDef[] = [
  { name: "title", label: "נושא הפגישה", type: "text", required: true },
  { name: "description", label: "תיאור / סדר יום", type: "textarea" },
  { name: "start_time", label: "תאריך ושעת התחלה", type: "datetime-local", required: true },
  { name: "end_time", label: "תאריך ושעת סיום", type: "datetime-local", required: true },
  { name: "location", label: "מיקום", type: "text" },
  { name: "meeting_url", label: "קישור לפגישה (Zoom/Meet)", type: "text" },
  { name: "status", label: "סטטוס", type: "select", options: statusOptions, required: true },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
}

function MeetingsHero() {
  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("meetings").select("*").order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const { days, monthLabel } = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startWeekday = first.getDay(); // Sunday=0 — Hebrew week starts Sunday
    const cells: { date: Date | null; events: any[] }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, events: [] });
    for (let d = 1; d <= last.getDate(); d++) {
      const date = new Date(year, month, d);
      const dayEvents = meetings.filter((m: any) => {
        const md = new Date(m.start_time);
        return md.getFullYear() === year && md.getMonth() === month && md.getDate() === d;
      });
      cells.push({ date, events: dayEvents });
    }
    return {
      days: cells,
      monthLabel: cursor.toLocaleDateString("he-IL", { month: "long", year: "numeric" }),
    };
  }, [cursor, meetings]);

  const upcoming = useMemo(
    () =>
      [...meetings]
        .filter((m: any) => new Date(m.start_time) >= new Date() && m.status === "scheduled")
        .slice(0, 3),
    [meetings],
  );

  const today = new Date();
  const weekdayLabels = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="glass-strong rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            ›
          </Button>
          <h2 className="font-semibold text-lg">{monthLabel}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            ‹
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground mb-1">
          {weekdayLabels.map((d) => (
            <div key={d} className="py-1 font-medium">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((cell, i) => {
            const isToday =
              cell.date &&
              cell.date.getFullYear() === today.getFullYear() &&
              cell.date.getMonth() === today.getMonth() &&
              cell.date.getDate() === today.getDate();
            return (
              <div
                key={i}
                className={cn(
                  "aspect-square rounded-lg p-1 text-xs flex flex-col",
                  cell.date ? "glass" : "opacity-0 pointer-events-none",
                  isToday && "border-2 border-accent shadow-glow",
                )}
              >
                {cell.date && (
                  <>
                    <span className={cn("font-medium", isToday && "text-accent")}>{cell.date.getDate()}</span>
                    {cell.events.length > 0 && (
                      <div className="mt-auto flex flex-wrap gap-0.5">
                        {cell.events.slice(0, 3).map((e: any) => (
                          <span
                            key={e.id}
                            className="size-1.5 rounded-full bg-primary"
                            title={e.title}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-strong rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Video className="size-4 text-accent" />
          הפגישות הקרובות
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground">אין פגישות מתוכננות</p>
        ) : (
          upcoming.map((m: any) => (
            <div key={m.id} className="glass rounded-xl p-3">
              <div className="font-medium text-sm truncate">{m.title}</div>
              <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(m.start_time)}
              </div>
            </div>
          ))
        )}
        <Button variant="outline" size="sm" className="w-full glass" disabled>
          סנכרון ליומן (בקרוב)
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/meetings")({
  component: () => (
    <CrudPage
      title="פגישות"
      subtitle="ניהול פגישות וסנכרון עם היומנים שלך"
      table="meetings"
      fields={fields}
      searchKeys={["title", "description", "location"]}
      orderBy="start_time"
      extraHeader={<MeetingsHero />}
      renderCard={(item, actions) => (
        <article key={item.id} className="glass rounded-2xl p-4 hover:border-accent/40 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{item.title}</h3>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              )}
            </div>
            {actions}
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3" />
              {formatDate(item.start_time)} – {new Date(item.end_time).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
            </div>
            {item.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3" />
                {item.location}
              </div>
            )}
            {item.meeting_url && (
              <a
                href={item.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-accent hover:underline truncate"
              >
                <Link2 className="size-3" />
                הצטרף לפגישה
              </a>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-border/50">
            <StatusPill label={statusLabel[item.status] ?? item.status} tone={statusTone[item.status]} />
          </div>
        </article>
      )}
    />
  ),
});
