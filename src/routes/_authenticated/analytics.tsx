import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Target, Trophy, Percent, Wallet, XCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { useMemo } from "react";
import { MonthlyTargetCard } from "@/components/MonthlyTarget";
import { LOST_REASON_LABEL } from "@/lib/lead-utils";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

const leadStatusLabels: Record<string, string> = {
  new: "חדש", contacted: "יצרנו קשר", qualified: "רלוונטי", converted: "הפך ללקוח", lost: "לא רלוונטי",
};
const leadStatusColors: Record<string, string> = {
  new: "#38bdf8", contacted: "#a78bfa", qualified: "#22d3ee", converted: "#10b981", lost: "#ef4444",
};

function AnalyticsPage() {
  const leads = useQuery({
    queryKey: ["analytics-leads"],
    queryFn: async () => (await supabase.from("leads").select("id, status, estimated_value, created_at, converted_at, lost_reason")).data ?? [],
  });
  const customers = useQuery({
    queryKey: ["analytics-customers"],
    queryFn: async () => (await supabase.from("customers").select("id, created_at, name, company")).data ?? [],
  });
  const incomes = useQuery({
    queryKey: ["analytics-incomes"],
    queryFn: async () => (await supabase.from("incomes").select("amount, income_date, customer_id, customer_name")).data ?? [],
  });
  const expenses = useQuery({
    queryKey: ["analytics-expenses"],
    queryFn: async () => (await supabase.from("expenses").select("amount, expense_date")).data ?? [],
  });
  const quotes = useQuery({
    queryKey: ["analytics-quotes"],
    queryFn: async () => (await supabase.from("quotes").select("total_amount, status, created_at")).data ?? [],
  });

  const kpis = useMemo(() => {
    const leadsArr = leads.data ?? [];
    const incomesArr = incomes.data ?? [];
    const expensesArr = expenses.data ?? [];
    const quotesArr = quotes.data ?? [];

    const total = leadsArr.length || 1;
    const converted = leadsArr.filter((l: any) => l.status === "converted").length;
    const conversionRate = (converted / total) * 100;

    const pipelineValue = leadsArr
      .filter((l: any) => ["new", "contacted", "qualified"].includes(l.status))
      .reduce((s: number, l: any) => s + (Number(l.estimated_value) || 0), 0);

    const totalIncome = incomesArr.reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const totalExpense = expensesArr.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
    const netProfit = totalIncome - totalExpense;

    const quotesAccepted = quotesArr.filter((q: any) => q.status === "accepted").length;
    const quotesTotal = quotesArr.length || 1;
    const quoteWinRate = (quotesAccepted / quotesTotal) * 100;

    return { conversionRate, pipelineValue, totalIncome, totalExpense, netProfit, quoteWinRate };
  }, [leads.data, incomes.data, expenses.data, quotes.data]);

  const funnelData = useMemo(() => {
    const arr = leads.data ?? [];
    return ["new", "contacted", "qualified", "converted", "lost"].map((s) => ({
      name: leadStatusLabels[s],
      value: arr.filter((l: any) => l.status === s).length,
      total: arr.filter((l: any) => l.status === s).reduce((sum: number, l: any) => sum + (Number(l.estimated_value) || 0), 0),
      color: leadStatusColors[s],
    }));
  }, [leads.data]);

  const monthlyRevenue = useMemo(() => {
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    const monthKey = (d: string) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    };
    const label = (k: string) => {
      const [y, m] = k.split("-");
      return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("he-IL", { month: "short", year: "2-digit" });
    };
    (incomes.data ?? []).forEach((i: any) => {
      if (!i.income_date) return;
      const k = monthKey(i.income_date);
      months[k] = months[k] || { month: label(k), income: 0, expense: 0 };
      months[k].income += Number(i.amount) || 0;
    });
    (expenses.data ?? []).forEach((e: any) => {
      if (!e.expense_date) return;
      const k = monthKey(e.expense_date);
      months[k] = months[k] || { month: label(k), income: 0, expense: 0 };
      months[k].expense += Number(e.amount) || 0;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v);
  }, [incomes.data, expenses.data]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>();
    (incomes.data ?? []).forEach((i: any) => {
      const key = i.customer_id ?? i.customer_name ?? "אחר";
      const name = i.customer_name ?? "לא ידוע";
      const cur = map.get(key) ?? { name, total: 0 };
      cur.total += Number(i.amount) || 0;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [incomes.data]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="size-7 text-accent" /> אנליטיקה ומכירות
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">מדדי הביצועים המרכזיים של העסק</p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KPI icon={Percent} label="שיעור המרה" value={`${kpis.conversionRate.toFixed(1)}%`} sub="לידים ← לקוחות" color="from-emerald-400 to-teal-500" />
        <KPI icon={Target} label="שווי צנרת" value={`₪${kpis.pipelineValue.toLocaleString()}`} sub="לידים פתוחים" color="from-cyan-400 to-blue-500" />
        <KPI icon={Trophy} label="הצלחת הצעות" value={`${kpis.quoteWinRate.toFixed(1)}%`} sub="הצעות מחיר שאושרו" color="from-violet-400 to-fuchsia-500" />
        <KPI icon={TrendingUp} label="הכנסות" value={`₪${kpis.totalIncome.toLocaleString()}`} color="from-emerald-500 to-green-600" />
        <KPI icon={Wallet} label="הוצאות" value={`₪${kpis.totalExpense.toLocaleString()}`} color="from-red-400 to-rose-500" />
        <KPI icon={BarChart3} label="רווח נטו" value={`₪${kpis.netProfit.toLocaleString()}`} color={kpis.netProfit >= 0 ? "from-emerald-500 to-teal-500" : "from-red-500 to-rose-600"} />
      </section>

      <MonthlyTargetCard />

      {/* Sales Funnel */}
      <section className="glass-strong rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="size-5 text-accent" />
          <h2 className="font-semibold">משפך מכירות</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" fontSize={11} />
              <YAxis dataKey="name" type="category" fontSize={11} width={80} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                formatter={(v: any, _n: any, p: any) => [`${v} לידים · ₪${p.payload.total.toLocaleString()}`, p.payload.name]}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {funnelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <FunnelStageDetails leads={leads.data ?? []} funnelData={funnelData} />
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Revenue trend */}
        <section className="glass-strong rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-accent" />
            <h2 className="font-semibold">הכנסות מול הוצאות (6 חודשים)</h2>
          </div>
          {monthlyRevenue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">אין נתונים עדיין</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="הכנסות" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" name="הוצאות" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Lead status pie */}
        <section className="glass-strong rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="size-5 text-accent" />
            <h2 className="font-semibold">התפלגות לידים</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={funnelData.filter((d) => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e: any) => `${e.name}: ${e.value}`}>
                  {funnelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Top customers */}
      <section className="glass-strong rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="size-5 text-accent" />
          <h2 className="font-semibold">לקוחות מובילים לפי הכנסה</h2>
        </div>
        {topCustomers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">אין נתוני הכנסה עדיין</p>
        ) : (
          <ul className="space-y-2">
            {topCustomers.map((c, i) => (
              <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                </div>
                <span className="font-bold gradient-text">₪{c.total.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="glass-strong rounded-3xl p-4">
      <div className={`size-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon className="size-5 text-white" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</div>}
    </div>
  );
}

function FunnelStageDetails({ leads, funnelData }: { leads: any[]; funnelData: any[] }) {
  const total = funnelData.reduce((s, f) => s + f.value, 0);
  const converted = leads.filter((l) => l.status === "converted" && l.converted_at);
  const avgDays = converted.length
    ? Math.round(
        converted.reduce((s, l) => s + (new Date(l.converted_at).getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24), 0) /
          converted.length,
      )
    : 0;
  const lostByReason: Record<string, number> = {};
  leads.filter((l) => l.status === "lost" && l.lost_reason).forEach((l) => {
    lostByReason[l.lost_reason] = (lostByReason[l.lost_reason] ?? 0) + 1;
  });
  return (
    <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
      {funnelData.map((f) => (
        <div key={f.name} className="glass rounded-2xl p-3 border border-border/40">
          <div className="font-medium">{f.name}</div>
          <div className="text-muted-foreground mt-1">
            {f.value} לידים · {total > 0 ? Math.round((f.value / total) * 100) : 0}%
          </div>
          <div className="text-muted-foreground">₪{f.total.toLocaleString()}</div>
        </div>
      ))}
      <div className="glass rounded-2xl p-3 border border-border/40">
        <div className="font-medium">זמן ממוצע להמרה</div>
        <div className="text-muted-foreground mt-1">{avgDays} ימים</div>
      </div>
      {Object.keys(lostByReason).length > 0 && (
        <div className="glass rounded-2xl p-3 border border-border/40 sm:col-span-2">
          <div className="font-medium flex items-center gap-1"><XCircle className="size-3" /> סיבות אובדן</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(lostByReason).map(([k, v]) => (
              <span key={k} className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                {LOST_REASON_LABEL[k] ?? k}: {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
