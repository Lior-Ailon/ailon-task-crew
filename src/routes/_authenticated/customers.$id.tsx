import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, Mail, Phone, MapPin, FileText, Building2, Calendar,
  FolderKanban, Receipt, Repeat, TrendingUp, CalendarDays, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/CrudPage";
import { ActivityTimeline } from "@/components/ActivityTimeline";

function daysUntil(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  const now = Date.now();
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
}

function CustomerDetailPage() {
  const { id } = Route.useParams();

  const customer = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const projects = useQuery({
    queryKey: ["customer-projects", id],
    queryFn: async () =>
      (await supabase.from("projects").select("*").eq("customer_id", id).order("created_at", { ascending: false })).data ?? [],
  });
  const quotes = useQuery({
    queryKey: ["customer-quotes", id],
    queryFn: async () =>
      (await supabase.from("quotes").select("*").eq("customer_id", id).order("created_at", { ascending: false })).data ?? [],
  });
  const subscriptions = useQuery({
    queryKey: ["customer-subscriptions", id],
    queryFn: async () =>
      (await supabase.from("subscriptions").select("*").eq("customer_id", id).order("created_at", { ascending: false })).data ?? [],
  });
  const incomes = useQuery({
    queryKey: ["customer-incomes", id],
    queryFn: async () =>
      (await supabase.from("incomes").select("*").eq("customer_id", id).order("income_date", { ascending: false })).data ?? [],
  });
  const meetings = useQuery({
    queryKey: ["customer-meetings", id],
    queryFn: async () =>
      (await supabase.from("meetings").select("*").eq("customer_id", id).order("start_time", { ascending: false })).data ?? [],
  });
  const tasks = useQuery({
    queryKey: ["customer-tasks", id],
    queryFn: async () =>
      (await supabase.from("tasks").select("*").eq("customer_id", id).order("created_at", { ascending: false })).data ?? [],
  });

  const c = customer.data;
  const totalIncome = (incomes.data ?? []).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
  const activeSubs = (subscriptions.data ?? []).filter((s: any) => s.status === "active").length;
  const openProjects = (projects.data ?? []).filter((p: any) => p.status !== "completed" && p.status !== "cancelled").length;
  const openTasks = (tasks.data ?? []).filter((t: any) => t.status !== "done").length;
  const followUpDays = daysUntil(c?.next_follow_up_at);

  if (customer.isLoading) return <div className="text-center py-12 text-muted-foreground">טוען...</div>;
  if (!c) {
    return (
      <div className="glass-strong rounded-3xl p-12 text-center space-y-3">
        <p className="text-muted-foreground">הלקוח לא נמצא</p>
        <Link to="/customers"><Button variant="outline">חזרה לרשימת הלקוחות</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/customers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="size-4" /> חזרה ללקוחות
      </Link>

      {/* Header */}
      <header className="glass-strong rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground shrink-0">
          {c.name?.[0] ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold truncate">{c.name}</h1>
          {c.company && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="size-3.5" /> {c.company}
            </p>
          )}
          <div className="mt-3">
            <QuickContactActions email={c.email} phone={c.phone} />
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            {c.address && <span className="flex items-center gap-1"><MapPin className="size-3" />{c.address}</span>}
            {c.tax_id && <span className="flex items-center gap-1"><FileText className="size-3" />{c.tax_id}</span>}
          </div>
        </div>
      </header>

      {/* Follow-up banner */}
      {c.next_follow_up_at && (
        <div className={`glass-strong rounded-3xl p-4 border-s-4 flex items-start gap-3 ${
          (followUpDays ?? 0) < 0 ? "border-red-500" : (followUpDays ?? 0) <= 2 ? "border-amber-500" : "border-accent"
        }`}>
          <Bell className="size-5 mt-0.5 shrink-0 text-accent" />
          <div className="min-w-0">
            <div className="font-semibold text-sm">
              מעקב {(followUpDays ?? 0) < 0 ? "באיחור" : (followUpDays ?? 0) === 0 ? "להיום" : `בעוד ${followUpDays} ימים`}
            </div>
            <div className="text-xs text-muted-foreground">{new Date(c.next_follow_up_at).toLocaleString("he-IL")}</div>
            {c.follow_up_note && <p className="text-sm mt-2">{c.follow_up_note}</p>}
          </div>
        </div>
      )}

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={TrendingUp} label="סה״כ הכנסות" value={`₪${totalIncome.toLocaleString()}`} color="from-emerald-400 to-teal-500" />
        <KPI icon={FolderKanban} label="פרויקטים פעילים" value={openProjects} color="from-cyan-400 to-blue-500" />
        <KPI icon={Repeat} label="מנויים פעילים" value={activeSubs} color="from-violet-400 to-fuchsia-500" />
        <KPI icon={Receipt} label="הצעות מחיר" value={quotes.data?.length ?? 0} color="from-sky-400 to-indigo-500" />
      </section>

      {/* Two-col: Projects + Quotes */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="פרויקטים" icon={FolderKanban} to="/projects" count={projects.data?.length ?? 0}>
          {projects.data?.length ? (
            <ul className="space-y-2">
              {projects.data.slice(0, 5).map((p: any) => (
                <li key={p.id} className="p-3 rounded-xl bg-muted/30 flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{p.name}</div>
                    {p.description && <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>}
                  </div>
                  {p.budget && <span className="text-xs font-bold gradient-text shrink-0">₪{Number(p.budget).toLocaleString()}</span>}
                </li>
              ))}
            </ul>
          ) : <Empty label="אין פרויקטים ללקוח זה" />}
        </Panel>

        <Panel title="הצעות מחיר" icon={Receipt} to="/quotes" count={quotes.data?.length ?? 0}>
          {quotes.data?.length ? (
            <ul className="space-y-2">
              {quotes.data.slice(0, 5).map((q: any) => (
                <li key={q.id} className="p-3 rounded-xl bg-muted/30 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{q.quote_number ?? q.title ?? "הצעה"}</div>
                    <div className="text-xs text-muted-foreground">{q.status ?? "—"}</div>
                  </div>
                  {q.total_amount && <span className="text-xs font-bold gradient-text shrink-0">₪{Number(q.total_amount).toLocaleString()}</span>}
                </li>
              ))}
            </ul>
          ) : <Empty label="אין הצעות מחיר" />}
        </Panel>

        <Panel title="מנויים" icon={Repeat} to="/subscriptions" count={subscriptions.data?.length ?? 0}>
          {subscriptions.data?.length ? (
            <ul className="space-y-2">
              {subscriptions.data.slice(0, 5).map((s: any) => (
                <li key={s.id} className="p-3 rounded-xl bg-muted/30 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{s.plan_name}</div>
                    <div className="text-xs text-muted-foreground">{s.billing_cycle}</div>
                  </div>
                  <StatusPill label={s.status ?? "—"} tone={s.status === "active" ? "emerald" : "slate"} />
                </li>
              ))}
            </ul>
          ) : <Empty label="אין מנויים" />}
        </Panel>

        <Panel title="הכנסות אחרונות" icon={TrendingUp} to="/incomes" count={incomes.data?.length ?? 0}>
          {incomes.data?.length ? (
            <ul className="space-y-2">
              {incomes.data.slice(0, 5).map((i: any) => (
                <li key={i.id} className="p-3 rounded-xl bg-muted/30 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{i.customer_name ?? i.notes ?? "הכנסה"}</div>
                    <div className="text-xs text-muted-foreground">{i.income_date}</div>
                  </div>
                  <span className="text-xs font-bold gradient-text shrink-0">₪{Number(i.amount).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : <Empty label="אין הכנסות" />}
        </Panel>

        <Panel title="פגישות" icon={CalendarDays} to="/meetings" count={meetings.data?.length ?? 0}>
          {meetings.data?.length ? (
            <ul className="space-y-2">
              {meetings.data.slice(0, 5).map((m: any) => (
                <li key={m.id} className="p-3 rounded-xl bg-muted/30">
                  <div className="font-medium text-sm truncate">{m.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />{new Date(m.start_time).toLocaleString("he-IL")}
                  </div>
                </li>
              ))}
            </ul>
          ) : <Empty label="אין פגישות" />}
        </Panel>

        <Panel title="משימות" icon={FileText} to="/tasks" count={openTasks}>
          {tasks.data?.length ? (
            <ul className="space-y-2">
              {tasks.data.slice(0, 5).map((t: any) => (
                <li key={t.id} className="p-3 rounded-xl bg-muted/30 flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{t.title}</div>
                    {t.due_date && <div className="text-xs text-muted-foreground">עד {t.due_date}</div>}
                  </div>
                  <StatusPill label={t.status ?? "—"} tone={t.status === "done" ? "emerald" : "amber"} />
                </li>
              ))}
            </ul>
          ) : <Empty label="אין משימות" />}
        </Panel>
      </div>

      <ActivityTimeline entityType="customer" entityId={c.id} />

      {c.notes && (
        <section className="glass-strong rounded-3xl p-5">
          <h2 className="font-semibold mb-2">הערות</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.notes}</p>
        </section>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, color }: any) {
  return (
    <div className="glass-strong rounded-3xl p-4">
      <div className={`size-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon className="size-5 text-white" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Panel({ title, icon: Icon, to, count, children }: any) {
  return (
    <section className="glass-strong rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-4 text-accent" />
        <h2 className="font-semibold text-sm">{title}</h2>
        <span className="text-xs text-muted-foreground">({count})</span>
        <Link to={to} className="text-xs text-primary hover:underline mr-auto">לכל ←</Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-xs text-muted-foreground text-center py-4">{label}</p>;
}

export const Route = createFileRoute("/_authenticated/customers/$id")({
  component: CustomerDetailPage,
});
