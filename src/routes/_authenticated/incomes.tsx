import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage, type FieldDef } from "@/components/CrudPage";
import { Users, Calendar } from "lucide-react";

const fields: FieldDef[] = [
  { name: "income_date", label: "תאריך", type: "date", required: true },
  { name: "customer_id", label: "לקוח", type: "lookup", lookupTable: "customers", labelField: "name" },
  { name: "customer_name", label: "שם לקוח (חופשי)", type: "text" },
  { name: "amount", label: "סכום (₪)", type: "number", required: true },
  { name: "notes", label: "הערות", type: "textarea" },
];

function IncomesPage() {
  const { data: customers = [] } = useQuery({
    queryKey: ["lookup", "customers"],
    queryFn: async () => (await supabase.from("customers").select("id, name")).data ?? [],
  });
  const customerMap = new Map(customers.map((c: any) => [c.id, c.name]));

  const { data: items = [] } = useQuery({
    queryKey: ["incomes"],
    queryFn: async () => (await (supabase.from as any)("incomes").select("*")).data ?? [],
  });
  const total = items.reduce((sum: number, i: any) => sum + Number(i.amount ?? 0), 0);

  return (
    <CrudPage
      title="הכנסות"
      subtitle="מעקב אחר הכנסות מלקוחות"
      table={"incomes" as any}
      fields={fields}
      searchKeys={["customer_name", "notes"]}
      orderBy="income_date"
      extraHeader={
        <div className="glass-strong rounded-3xl p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">סה״כ הכנסות</span>
          <span className="text-2xl font-bold gradient-text">₪{total.toLocaleString()}</span>
        </div>
      }
      renderCard={(item, actions) => (
        <article key={item.id} className="glass-strong rounded-3xl p-4 hover:border-primary/40 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate flex items-center gap-1.5">
                <Users className="size-3.5 text-muted-foreground" />
                {item.customer_id ? customerMap.get(item.customer_id) ?? item.customer_name ?? "—" : item.customer_name ?? "—"}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="size-3" />{item.income_date}
              </p>
            </div>
            {actions}
          </div>
          {item.notes && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.notes}</p>}
          <div className="pt-3 border-t border-border/50 text-left">
            <span className="text-lg font-bold text-emerald-600">₪{Number(item.amount ?? 0).toLocaleString()}</span>
          </div>
        </article>
      )}
    />
  );
}

export const Route = createFileRoute("/_authenticated/incomes")({
  component: IncomesPage,
});
