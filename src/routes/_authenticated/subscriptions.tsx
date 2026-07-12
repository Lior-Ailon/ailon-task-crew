import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Users, Repeat, Calendar } from "lucide-react";

const cycleOptions = [
  { value: "monthly", label: "חודשי" },
  { value: "quarterly", label: "רבעוני" },
  { value: "yearly", label: "שנתי" },
  { value: "one_time", label: "חד-פעמי" },
];
const statusOptions = [
  { value: "active", label: "פעיל" },
  { value: "paused", label: "מושהה" },
  { value: "cancelled", label: "בוטל" },
  { value: "expired", label: "פג תוקף" },
];
const statusTone: Record<string, any> = { active: "emerald", paused: "amber", cancelled: "red", expired: "slate" };
const statusLabel: Record<string, string> = Object.fromEntries(statusOptions.map((s) => [s.value, s.label]));
const cycleLabel: Record<string, string> = Object.fromEntries(cycleOptions.map((s) => [s.value, s.label]));

const fields: FieldDef[] = [
  { name: "plan_name", label: "שם התוכנית", type: "text", required: true },
  { name: "customer_id", label: "לקוח", type: "lookup", lookupTable: "customers", labelField: "name" },
  { name: "price", label: "מחיר (₪)", type: "number" },
  { name: "billing_cycle", label: "מחזור חיוב", type: "select", options: cycleOptions, required: true },
  { name: "status", label: "סטטוס", type: "select", options: statusOptions, required: true },
  { name: "start_date", label: "תאריך התחלה", type: "date" },
  { name: "next_billing_date", label: "חיוב הבא", type: "date" },
  { name: "notes", label: "הערות", type: "textarea" },
];

function SubscriptionsPage() {
  const { data: customers = [] } = useQuery({
    queryKey: ["lookup", "customers"],
    queryFn: async () => (await supabase.from("customers").select("id, name")).data ?? [],
  });
  const customerMap = new Map(customers.map((c: any) => [c.id, c.name]));

  return (
    <CrudPage
      title="מנויים"
      subtitle="ניהול מנויים והכנסה חוזרת מלקוחות"
      table="subscriptions"
      fields={fields}
      searchKeys={["plan_name", "notes"]}
      renderCard={(item, actions) => (
        <article key={item.id} className="glass-strong rounded-3xl p-4 hover:border-primary/40 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{item.plan_name}</h3>
              {item.customer_id && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Users className="size-3" />{customerMap.get(item.customer_id) ?? "—"}
                </p>
              )}
            </div>
            {actions}
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><Repeat className="size-3" />{cycleLabel[item.billing_cycle] ?? item.billing_cycle}</div>
            {item.next_billing_date && (
              <div className="flex items-center gap-2"><Calendar className="size-3" />חיוב הבא: {item.next_billing_date}</div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <StatusPill label={statusLabel[item.status] ?? item.status} tone={statusTone[item.status]} />
            {item.price != null && (
              <span className="text-sm font-bold gradient-text">₪{Number(item.price).toLocaleString()}</span>
            )}
          </div>
        </article>
      )}
    />
  );
}

export const Route = createFileRoute("/_authenticated/subscriptions")({
  component: SubscriptionsPage,
});
