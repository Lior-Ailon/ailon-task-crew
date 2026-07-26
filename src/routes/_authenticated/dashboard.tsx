import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Users, FolderKanban, CheckSquare, TrendingUp, Clock, Lightbulb, FileText, CalendarDays, MapPin, Plus, Package, ExternalLink, Bell, LayoutGrid, ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MonthlyTargetCard } from "@/components/MonthlyTarget";
import { toast } from "sonner";
import logoAsset from "@/assets/ailon-logo.png.asset.json";
import introVideo from "@/assets/ailon-intro.mp4.asset.json";
import officeAsset from "@/assets/ailon-office.jpg.asset.json";
import { getAppIcon } from "@/lib/shelf-product-icons";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE, TASK_STATUS_LABEL, TASK_STATUS_TONE, STATUS_TONE_CLASS, SOFT_OVERDUE } from "@/lib/status-colors";
import { sendEntityNotification } from "@/lib/email/send-entity-notification";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function useCount(table: "leads" | "customers" | "projects" | "tasks" | "ideas" | "quotes") {
  return useQuery({
    queryKey: ["count", table],
    queryFn: async () => {
      let query: any = supabase.from(table).select("*", { count: "exact", head: true });
      if (table === "tasks") query = query.neq("status", "done");
      const { count, error } = await query;
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

  const meetingsCount = useQuery({
    queryKey: ["count", "meetings", "upcoming"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("meetings")
        .select("*", { count: "exact", head: true })
        .eq("status", "scheduled")
        .gte("start_time", new Date().toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });

  const shelfProductsCount = useQuery({
    queryKey: ["count", "shelf-products", "active"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("shelf_products")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count ?? 0;
    },
  });

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
    { label: "לידים", value: leads.data ?? 0, icon: UserPlus, to: "/leads" },
    { label: "לקוחות", value: customers.data ?? 0, icon: Users, to: "/customers" },
    { label: "פרויקטים", value: projects.data ?? 0, icon: FolderKanban, to: "/projects" },
    { label: "משימות", value: tasks.data ?? 0, icon: CheckSquare, to: "/tasks" },
    { label: "רעיונות", value: ideas.data ?? 0, icon: Lightbulb, to: "/ideas" },
    { label: "הצעות מחיר", value: quotes.data ?? 0, icon: FileText, to: "/quotes" },
    { label: "פגישות", value: meetingsCount.data ?? 0, icon: CalendarDays, to: "/meetings" },
    { label: "מוצרי מדף", value: shelfProductsCount.data ?? 0, icon: Package, to: "/shelf-products" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Compact hero — video desktop-only */}
      <header className="relative overflow-hidden rounded-3xl glass-strong">
        <img
          src={officeAsset.url}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <video
          src={introVideo.url}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 size-full object-cover opacity-40 mix-blend-luminosity hidden md:block"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-primary/90 via-primary/60 to-primary/20" />
        <div className="relative z-10 p-3 sm:p-4 flex items-center gap-3 text-white">
          <img src={logoAsset.url} alt="" className="size-10 sm:size-12 object-contain drop-shadow-lg shrink-0" />
          <div className="min-w-0">
            <div className="text-xs tracking-[0.3em] opacity-80">AILON TASK · CRM</div>
            <h1 className="text-lg sm:text-xl font-extrabold mt-0.5 leading-tight">
              Dream it. Plan it. <span className="text-accent">Achieve it.</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Actionable first: follow-ups, today's meetings, open tasks */}
      <FollowUpsSection />

      <div className="grid lg:grid-cols-2 gap-4">
        <TodayMeetingsSection />
        <section className="glass-strong rounded-3xl p-5">
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

      {/* Target + KPI cards */}
      <MonthlyTargetCard compact />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <Link
            key={s.label}
            to={s.to}
            className="glass-strong rounded-3xl p-4 sm:p-5 hover:scale-[1.02] transition-transform group"
          >
            <div
              className="size-10 rounded-xl flex items-center justify-center mb-3 group-hover:glow transition-shadow"
              style={{
                background: `linear-gradient(135deg, var(--primary), var(--accent))`,
                opacity: 0.85 + (i % 2) * 0.1,
              }}
            >
              <s.icon className="size-5 text-primary-foreground" />
            </div>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Link>
        ))}
      </section>

      {/* Secondary content */}
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="glass-strong rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-accent" />
              <h2 className="font-semibold">לידים פתוחים</h2>
            </div>
            <Link to="/leads-board" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              <LayoutGrid className="size-3" /> לוח Kanban ←
            </Link>
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

        <section className="glass-strong rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="size-5 text-accent" />
            <h2 className="font-semibold">רעיונות אחרונים</h2>
            <Link to="/ideas" className="text-xs text-primary hover:underline mr-auto">לכל הרעיונות ←</Link>
          </div>
          {recentIdeas.data?.length ? (
            <ul className="grid sm:grid-cols-2 gap-2">
              {recentIdeas.data.map((idea: any) => (
                <li key={idea.id} className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="font-medium text-sm truncate">{idea.title}</div>
                  {idea.description && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{idea.description}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full tone-warning">
                      {idea.status ?? "חדש"}
                    </span>
                    {idea.priority && (
                      <span className="text-xs text-muted-foreground">עדיפות: {idea.priority}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">אין רעיונות עדיין — <Link to="/ideas" className="text-primary hover:underline">הוסף ראשון</Link></p>
          )}
        </section>
      </div>

      <ShelfProductsSection />

      <MeetingsCalendarSection />

      {/* Quote at the very bottom, subtle */}
      <blockquote className="glass rounded-3xl p-4 text-center border-s-2 border-accent/40 opacity-80">
        <p className="text-sm italic text-muted-foreground">
          "מה שלא ניתן למדוד לא ניתן לנהל, ומה שלא ניתן לנהל לא ניתן לשפר"
        </p>
        <footer className="mt-1 text-xs text-muted-foreground/80">— פיטר דרוקר</footer>
      </blockquote>
    </div>
  );
}

function TodayMeetingsSection() {
  const { data: meetings = [] } = useQuery({
    queryKey: ["today-meetings"],
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from("meetings")
        .select("id, title, start_time, location")
        .eq("status", "scheduled")
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="glass-strong rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="size-5 text-accent" />
        <h2 className="font-semibold">פגישות היום</h2>
        <Link to="/meetings" className="mr-auto text-xs text-primary hover:underline">ליומן ←</Link>
      </div>
      {meetings.length ? (
        <ul className="space-y-2">
          {meetings.map((m: any) => (
            <li key={m.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/30">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{m.title}</div>
                {m.location && <div className="text-xs text-muted-foreground truncate flex items-center gap-1"><MapPin className="size-3" />{m.location}</div>}
              </div>
              <div className="text-xs font-medium text-primary shrink-0">
                {new Date(m.start_time).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">אין פגישות היום</p>
      )}
    </section>
  );
}


function FollowUpsSection() {
  const nowIso = new Date().toISOString();
  const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const leadsFollow = useQuery({
    queryKey: ["follow-ups", "leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, company, next_follow_up_at, follow_up_note")
        .not("next_follow_up_at", "is", null)
        .lte("next_follow_up_at", in7)
        .order("next_follow_up_at", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const customersFollow = useQuery({
    queryKey: ["follow-ups", "customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company, next_follow_up_at, follow_up_note")
        .not("next_follow_up_at", "is", null)
        .lte("next_follow_up_at", in7)
        .order("next_follow_up_at", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const combined = [
    ...(leadsFollow.data ?? []).map((x: any) => ({ ...x, kind: "lead" as const })),
    ...(customersFollow.data ?? []).map((x: any) => ({ ...x, kind: "customer" as const })),
  ].sort((a, b) => new Date(a.next_follow_up_at).getTime() - new Date(b.next_follow_up_at).getTime());

  const overdue = combined.filter((x) => x.next_follow_up_at < nowIso);
  const upcoming = combined.filter((x) => x.next_follow_up_at >= nowIso);

  return (
    <section className="glass-strong rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="size-5 text-accent" />
        <h2 className="font-semibold">מעקבים דחופים</h2>
        <span className="text-xs text-muted-foreground">7 הימים הקרובים</span>
        {overdue.length > 0 && (
          <span className={cn("mr-auto text-xs font-bold px-2 py-0.5 rounded-full", SOFT_OVERDUE)}>
            {overdue.length} באיחור
          </span>
        )}
      </div>
      {combined.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          אין מעקבים מתוזמנים. הגדר תאריך "מעקב הבא" על ליד או לקוח כדי לא לשכוח לחזור אליהם.
        </p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-2">
          {combined.slice(0, 8).map((item: any) => {
            const date = new Date(item.next_follow_up_at);
            const isOverdue = date < new Date();
            return (
              <li key={`${item.kind}-${item.id}`} className={cn(
                "p-3 rounded-xl border flex items-start gap-2",
                isOverdue ? "tone-danger" : "bg-muted/30 border-border/40",
              )}>
                <div className={cn(
                  "size-8 rounded-lg flex items-center justify-center shrink-0",
                  item.kind === "customer" ? "tone-info" : "tone-warning",
                )}>
                  {item.kind === "customer" ? <Users className="size-4" /> : <UserPlus className="size-4" />}
                </div>

                {item.kind === "customer" ? (
                  <Link to="/customers/$id" params={{ id: item.id }} className="min-w-0 flex-1 hover:opacity-80">
                    <FollowUpBody item={item} date={date} isOverdue={isOverdue} />
                  </Link>
                ) : (
                  <Link to="/leads/$id" params={{ id: item.id }} className="min-w-0 flex-1 hover:opacity-80">
                    <FollowUpBody item={item} date={date} isOverdue={isOverdue} />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {upcoming.length > 8 && (
        <p className="text-xs text-muted-foreground text-center mt-3">+ {upcoming.length - 8} מעקבים נוספים</p>
      )}
    </section>
  );
}

function FollowUpBody({ item, date, isOverdue }: { item: any; date: Date; isOverdue: boolean }) {
  return (
    <>
      <div className="font-medium text-sm truncate">{item.name}</div>
      {item.company && <div className="text-xs text-muted-foreground truncate">{item.company}</div>}
      {item.follow_up_note && <div className="text-xs mt-1 line-clamp-1">{item.follow_up_note}</div>}
      <div className={cn("text-xs mt-1 font-medium", isOverdue ? "text-[var(--danger)]" : "text-[var(--warning)]")}>
        {isOverdue ? "באיחור: " : ""}{date.toLocaleDateString("he-IL")} {date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </>
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
    <section className="glass-strong rounded-3xl p-5">
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
            <Button variant="ghost" size="icon" aria-label="חודש קודם" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
              <ChevronRight className="size-4" />
            </Button>
            <h3 className="font-medium text-sm">{monthLabel}</h3>
            <Button variant="ghost" size="icon" aria-label="חודש הבא" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
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
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(m.start_time).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}
                </div>
                {m.location && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
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

function NewMeetingDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") || "").trim();
    const start_time = String(fd.get("start_time") || "");
    const location = String(fd.get("location") || "") || null;
    const meeting_url = String(fd.get("meeting_url") || "") || null;
    const description = String(fd.get("description") || "") || null;
    if (!title || !start_time) return toast.error("חסרים שדות חובה");

    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase.from("meetings").insert({
      title, start_time, location, meeting_url, description,
      status: "scheduled", user_id: userData.user?.id ?? "",
    } as any).select().maybeSingle();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("הפגישה נקבעה");
    sendEntityNotification({
      entityLabel: "פגישה",
      action: "נוצר",
      title,
      entityId: inserted?.id ?? "unknown",
      fields: [
        { label: "start_time", value: start_time },
        ...(location ? [{ label: "location", value: location }] : []),
        ...(meeting_url ? [{ label: "meeting_url", value: meeting_url }] : []),
      ],
      actor: userData.user?.email ?? undefined,
    });
    qc.invalidateQueries({ queryKey: ["dashboard-meetings"] });
    qc.invalidateQueries({ queryKey: ["meetings"] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1"><Plus className="size-4" />פגישה חדשה</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>קביעת פגישה חדשה</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div><Label>נושא *</Label><Input name="title" required /></div>
          <div><Label>תאריך ושעה *</Label><Input name="start_time" type="datetime-local" required /></div>
          <div><Label>מיקום</Label><Input name="location" /></div>
          <div><Label>קישור (Zoom/Meet)</Label><Input name="meeting_url" /></div>
          <div><Label>תיאור</Label><Textarea name="description" rows={3} /></div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>{saving ? "שומר..." : "קבע פגישה"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShelfProductsSection() {
  const { data: products = [] } = useQuery({
    queryKey: ["dashboard-shelf-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shelf_products")
        .select("id, name, description, link, status")
        .eq("status", "active")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="glass-strong rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Package className="size-5 text-accent" />
        <h2 className="font-semibold">מוצרי מדף</h2>
        <Link to="/shelf-products" className="text-xs text-primary hover:underline mr-auto">לכל המוצרים ←</Link>
      </div>
      {products.length ? (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {products.map((product: any) => {
            const app = getAppIcon(product.name);
            const AppIcon = app.icon;
            return (
              <li key={product.id} className="glass-strong rounded-2xl p-4 relative overflow-hidden isolate hover:border-primary/40 transition-colors">
                <div className={cn("absolute -top-6 -start-6 size-32 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-2xl pointer-events-none", app.watermark)} />
                <div className="relative flex items-start gap-3 mb-2">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", app.gradient)}>
                    <AppIcon className={cn("size-5", app.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                    )}
                  </div>
                </div>
                {product.link && (
                  <a
                    href={product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="size-3" /> פתח את הכלי
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">אין מוצרי מדף פעילים — <Link to="/shelf-products" className="text-primary hover:underline">הוסף מוצר ראשון</Link></p>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = LEAD_STATUS_LABEL[status] ?? TASK_STATUS_LABEL[status] ?? status;
  const tone = LEAD_STATUS_TONE[status] ?? TASK_STATUS_TONE[status] ?? "default";
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_TONE_CLASS[tone]}`}>{label}</span>;
}
