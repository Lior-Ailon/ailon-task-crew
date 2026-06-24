import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Users, FolderKanban, CheckSquare, TrendingUp, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function useCount(table: "leads" | "customers" | "projects" | "tasks") {
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

  const recentTasks = useQuery({
    queryKey: ["recent-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
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

  const stats = [
    { label: "לידים", value: leads.data ?? 0, icon: UserPlus, to: "/leads", color: "from-fuchsia-500 to-purple-500" },
    { label: "לקוחות", value: customers.data ?? 0, icon: Users, to: "/customers", color: "from-cyan-400 to-blue-500" },
    { label: "פרויקטים", value: projects.data ?? 0, icon: FolderKanban, to: "/projects", color: "from-emerald-400 to-teal-500" },
    { label: "משימות", value: tasks.data ?? 0, icon: CheckSquare, to: "/tasks", color: "from-amber-400 to-orange-500" },
  ] as const;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold">
          שלום, ברוך הבא ל<span className="gradient-text">AILON TASK</span>
        </h1>
        <p className="text-muted-foreground mt-2">סקירה כללית של המערכת שלך</p>
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
            <h2 className="font-semibold">משימות אחרונות</h2>
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
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "חדש", cls: "bg-blue-500/20 text-blue-300" },
    contacted: { label: "יצרנו קשר", cls: "bg-purple-500/20 text-purple-300" },
    qualified: { label: "מוכשר", cls: "bg-cyan-500/20 text-cyan-300" },
    converted: { label: "המיר", cls: "bg-emerald-500/20 text-emerald-300" },
    lost: { label: "אבוד", cls: "bg-red-500/20 text-red-300" },
    todo: { label: "לביצוע", cls: "bg-slate-500/20 text-slate-300" },
    in_progress: { label: "בתהליך", cls: "bg-amber-500/20 text-amber-300" },
    done: { label: "הושלם", cls: "bg-emerald-500/20 text-emerald-300" },
  };
  const info = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${info.cls}`}>{info.label}</span>;
}
