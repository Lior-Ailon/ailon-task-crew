import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Users, FolderKanban, CheckSquare, TrendingUp, Clock, Lightbulb, FileText, CalendarDays, MapPin, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import logoAsset from "@/assets/ailon-logo.png.asset.json";
import introVideo from "@/assets/ailon-intro.mp4.asset.json";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function useCount(table: "leads" | "customers" | "projects" | "tasks" | "ideas" | "quotes") {
  return useQuery({
    queryKey: ["count", table],
    queryFn: async () => {
      const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function DashboardPage() {
  const leads = useCount("leads");
  const customers = useCount("customers");
  const projects = useCount("projects");
  const tasks = useCount("tasks");
  const ideas = useCount("ideas");
  const quotes = useCount("quotes");

  const recentTasks = useQuery({
    queryKey: ["recent-tasks", "open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .neq("status", "done")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const openLeads = useQuery({
    queryKey: ["open-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .in("status", ["new", "contacted", "qualified"])
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const recentIdeas = useQuery({
    queryKey: ["recent-ideas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ideas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const stats = [
    { label: "לידים", value: leads.data ?? 0, icon: UserPlus, to: "/leads", color: "from-fuchsia-500 to-purple-500" },
    { label: "לקוחות", value: customers.data ?? 0, icon: Users, to: "/customers", color: "from-cyan-400 to-blue-500" },
    { label: "פרויקטים", value: projects.data ?? 0, icon: FolderKanban, to: "/projects", color: "from-emerald-400 to-teal-500" },
    { label: "משימות", value: tasks.data ?? 0, icon: CheckSquare, to: "/tasks", color: "from-amber-400 to-orange-500" },
    { label: "רעיונות", value: ideas.data ?? 0, icon: Lightbulb, to: "/ideas", color: "from-yellow-400 to-amber-500" },
    { label: "הצעות מחיר", value: quotes.data ?? 0, icon: FileText, to: "/quotes", color: "from-sky-400 to-indigo-500" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Hero banner with intro video */}
      <header className="relative overflow-hidden rounded-3xl glass-strong">
        <video
          src={introVideo.url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 size-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary/85 via-primary/55 to-primary/10" />
        <div className="relative z-10 p-6 sm:p-10 flex items-center gap-5 text-white">
          <img src={logoAsset.url} alt="" className="size-16 sm:size-20 object-contain drop-shadow-lg shrink-0" />
          <div className="min-w-0">
            <div className="text-[11px] tracking-[0.3em] opacity-80">AILON TASK · CRM</div>
            <h1 className="text-2xl sm:text-4xl font-extrabold mt-1 leading-tight">
              Dream it. Plan it. <span className="text-accent">Achieve it.</span>
            </h1>
            <p className="opacity-85 text-xs sm:text-sm mt-2">סקירה כללית של המערכת שלך</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="glass rounded-2xl p-4 sm:p-5 hover:scale-[1.02] transition-transform group"
          >
            <div className={`size-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 group-hover:glow transition-shadow`}>
              <s.icon className="size-5 text-white" />
            </div>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Link>
        ))}
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-accent" />
            <h2 className="font-semibold">לידים פתוחים</h2>
          </div>
          {openLeads.data?.length ? (
            <ul className="space-y-2">
              {openLeads.data.map((l) => (
                <li key={l.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
                  <div>
                    <div className="font-medium text-sm">{l.name}</div>
                    {l.company && <div className="text-xs text-muted-foreground">{l.company}</div>}
                  </div>
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">אין לידים פתוחים</p>
          )}
        </section>

        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="size-5 text-accent" />
            <h2 className="font-semibold">משימות פתוחות</h2>
          </div>
          {recentTasks.data?.length ? (
            <ul className="space-y-2">
              {recentTasks.data.map((t) => (
                <li key={t.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
                  <div>
                    <div className="font-medium text-sm">{t.title}</div>
                    {t.due_date && <div className="text-xs text-muted-foreground">עד {t.due_date}</div>}
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">אין משימות עדיין</p>
          )}
        </section>
      </div>

      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="size-5 text-accent" />
          <h2 className="font-semibold">רעיונות אחרונים</h2>
          <Link to="/ideas" className="text-xs text-primary hover:underline mr-auto">לכל הרעיונות ←</Link>
        </div>
        {recentIdeas.data?.length ? (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {recentIdeas.data.map((idea: any) => (
              <li key={idea.id} className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <div className="font-medium text-sm truncate">{idea.title}</div>
                {idea.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{idea.description}</div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    {idea.status ?? "חדש"}
                  </span>
                  {idea.priority && (
                    <span className="text-[10px] text-muted-foreground">עדיפות: {idea.priority}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">אין רעיונות עדיין — <Link to="/ideas" className="text-primary hover:underline">הוסף ראשון</Link></p>
        )}
      </section>

      <MeetingsCalendarSection />
    </div>
  );
}

function MeetingsCalendarSection() {
  const { data: meetings = [] } = useQuery({
    queryKey: ["dashboard-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("meetings").select("*").order("start_time", { ascending: true });
      if (error) throw error;
      return data ?? [];
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
    const startWeekday = first.getDay();
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
      meetings
        .filter((m: any) => new Date(m.start_time) >= new Date() && m.status === "scheduled")
        .slice(0, 4),
    [meetings],
  );

  const today = new Date();
  const weekdayLabels = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="size-5 text-accent" />
        <h2 className="font-semibold">יומן פגישות</h2>
        <div className="mr-auto flex items-center gap-2">
          <NewMeetingDialog />
          <Link to="/meetings" className="text-xs text-primary hover:underline">לכל הפגישות ←</Link>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_280px] gap-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>›</Button>
            <h3 className="font-medium text-sm">{monthLabel}</h3>
            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>‹</Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
            {weekdayLabels.map((d) => <div key={d} className="py-1 font-medium">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((cell, i) => {
              const isToday = cell.date &&
                cell.date.getFullYear() === today.getFullYear() &&
                cell.date.getMonth() === today.getMonth() &&
                cell.date.getDate() === today.getDate();
              return (
                <div key={i} className={cn(
                  "aspect-square rounded-lg p-1 text-xs flex flex-col",
                  cell.date ? "bg-muted/30 border border-border/40" : "opacity-0 pointer-events-none",
                  isToday && "border-2 border-accent",
                )}>
                  {cell.date && (
                    <>
                      <span className={cn("font-medium", isToday && "text-accent")}>{cell.date.getDate()}</span>
                      {cell.events.length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-0.5">
                          {cell.events.slice(0, 3).map((e: any) => (
                            <span key={e.id} className="size-1.5 rounded-full bg-primary" title={e.title} />
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
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground">פגישות קרובות</h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-muted-foreground">אין פגישות מתוכננות</p>
          ) : (
            upcoming.map((m: any) => (
              <div key={m.id} className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <div className="font-medium text-sm truncate">{m.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {new Date(m.start_time).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}
                </div>
                {m.location && (
                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="size-3" />{m.location}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "חדש", cls: "bg-sky-100 text-sky-700 border border-sky-200" },
    contacted: { label: "יצרנו קשר", cls: "bg-violet-100 text-violet-700 border border-violet-200" },
    qualified: { label: "מוכשר", cls: "bg-cyan-100 text-cyan-700 border border-cyan-200" },
    converted: { label: "המיר", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
    lost: { label: "אבוד", cls: "bg-red-100 text-red-700 border border-red-200" },
    todo: { label: "לביצוע", cls: "bg-slate-100 text-slate-700 border border-slate-200" },
    in_progress: { label: "בתהליך", cls: "bg-amber-100 text-amber-700 border border-amber-200" },
    done: { label: "הושלם", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  };
  const info = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground border border-border" };
  return <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${info.cls}`}>{info.label}</span>;
}
