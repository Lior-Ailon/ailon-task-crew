import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight, Building2, Bell, TrendingUp, CalendarDays, FileText, Receipt,
  UserCircle2, Tag, Info, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/CrudPage";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { QuickContactActions } from "@/components/QuickContactActions";
import { LOST_REASON_LABEL } from "@/lib/lead-utils";

const statusMeta: Record<string, { label: string; tone: any }> = {
  new: { label: "חדש", tone: "blue" },
  contacted: { label: "יצרנו קשר", tone: "purple" },
  qualified: { label: "מוכשר", tone: "cyan" },
  converted: { label: "המיר", tone: "emerald" },
  lost: { label: "אבוד", tone: "red" },
};

function daysUntil(iso?: string | null) {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function LeadDetailPage() {
  const { id } = Route.useParams();

  const lead = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => (await supabase.from("leads").select("*").eq("id", id).maybeSingle()).data,
  });
  const meetings = useQuery({
    queryKey: ["lead-meetings", id],
    queryFn: async () => (await supabase.from("meetings").select("*").eq("lead_id", id).order("start_time", { ascending: false })).data ?? [],
  });
  const quotes = useQuery({
    queryKey: ["lead-quotes", id],
    queryFn: async () => (await supabase.from("quotes").select("*").eq("lead_id", id).order("created_at", { ascending: false })).data ?? [],
  });
  const tasks = useQuery({
    queryKey: ["lead-tasks", id],
    queryFn: async () => {
      // tasks has no lead_id column; return empty to keep panel consistent
      return [] as any[];
    },
  });
  const assigneeId = lead.data?.assigned_to as string | null | undefined;
  const assignee = useQuery({
    queryKey: ["profile", assigneeId],
    enabled: !!assigneeId,
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email").eq("id", assigneeId!).maybeSingle()).data,
  });

  const l = lead.data;
  const followUpDays = daysUntil(l?.next_follow_up_at);
  const meta = statusMeta[l?.status] ?? { label: l?.status ?? "—", tone: "default" };

  if (lead.isLoading) return <div className="text-center py-12 text-muted-foreground">טוען...</div>;
  if (!l) {
    return (
      <div className="glass-strong rounded-3xl p-12 text-center space-y-3">
        <p className="text-muted-foreground">הליד לא נמצא</p>
        <Link to="/leads"><Button variant="outline">חזרה לרשימת הלידים</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/leads" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="size-4" /> חזרה ללידים
      </Link>

      <header className="glass-strong rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="size-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {l.name?.[0] ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{l.name}</h1>
            <StatusPill label={meta.label} tone={meta.tone} />
          </div>
          {l.company && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="size-3.5" /> {l.company}
            </p>
          )}
          <div className="mt-3">
            <QuickContactActions email={l.email} phone={l.phone} />
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            {l.source && <span className="inline-flex items-center gap-1"><Tag className="size-3" />מקור: {l.source}</span>}
            {l.estimated_value != null && <span className="inline-flex items-center gap-1"><TrendingUp className="size-3" />ערך משוער: ₪{Number(l.estimated_value).toLocaleString()}</span>}
            {assignee.data && <span className="inline-flex items-center gap-1"><UserCircle2 className="size-3" />אחראי: {assignee.data.full_name ?? assignee.data.email}</span>}
          </div>
        </div>
        {l.customer_id && (
          <Link to="/customers/$id" params={{ id: l.customer_id }}>
            <Button variant="outline" className="glass">כרטיס הלקוח שנוצר ←</Button>
          </Link>
        )}
      </header>

      {l.next_follow_up_at && (
        <div className={`glass-strong rounded-3xl p-4 border-s-4 flex items-start gap-3 ${
          (followUpDays ?? 0) < 0 ? "border-red-500" : (followUpDays ?? 0) <= 2 ? "border-amber-500" : "border-accent"
        }`}>
          <Bell className="size-5 mt-0.5 shrink-0 text-accent" />
          <div className="min-w-0">
            <div className="font-semibold text-sm">
              מעקב {(followUpDays ?? 0) < 0 ? "באיחור" : (followUpDays ?? 0) === 0 ? "להיום" : `בעוד ${followUpDays} ימים`}
            </div>
            <div className="text-xs text-muted-foreground">{new Date(l.next_follow_up_at).toLocaleString("he-IL")}</div>
            {l.follow_up_note && <p className="text-sm mt-2">{l.follow_up_note}</p>}
          </div>
        </div>
      )}

      {l.status === "lost" && l.lost_reason && (
        <div className="glass-strong rounded-3xl p-4 border-s-4 border-red-500 flex items-start gap-3">
          <XCircle className="size-5 mt-0.5 shrink-0 text-red-500" />
          <div className="min-w-0">
            <div className="font-semibold text-sm">סיבת אובדן: {LOST_REASON_LABEL[l.lost_reason] ?? l.lost_reason}</div>
            {l.lost_reason_note && <p className="text-sm text-muted-foreground mt-1">{l.lost_reason_note}</p>}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="פגישות" icon={CalendarDays} to="/meetings" count={meetings.data?.length ?? 0}>
          {meetings.data?.length ? (
            <ul className="space-y-2">
              {meetings.data.slice(0, 5).map((m: any) => (
                <li key={m.id} className="p-3 rounded-xl bg-muted/30">
                  <div className="font-medium text-sm truncate">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(m.start_time).toLocaleString("he-IL")}</div>
                </li>
              ))}
            </ul>
          ) : <Empty label="אין פגישות" />}
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

        <Panel title="משימות" icon={FileText} to="/tasks" count={tasks.data?.length ?? 0}>
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

        {l.notes && (
          <section className="glass-strong rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Info className="size-4 text-accent" />
              <h2 className="font-semibold text-sm">הערות</h2>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{l.notes}</p>
          </section>
        )}
      </div>

      <ActivityTimeline entityType="lead" entityId={l.id} />
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

export const Route = createFileRoute("/_authenticated/leads/$id")({
  component: LeadDetailPage,
});
