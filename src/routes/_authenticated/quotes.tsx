import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Users, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const statusOptions = [
  { value: "draft", label: "טיוטה" },
  { value: "sent", label: "נשלחה" },
  { value: "accepted", label: "אושרה" },
  { value: "rejected", label: "נדחתה" },
  { value: "expired", label: "פגה" },
];
const statusTone: Record<string, any> = { draft: "slate", sent: "blue", accepted: "emerald", rejected: "red", expired: "amber" };
const statusLabel: Record<string, string> = Object.fromEntries(statusOptions.map((s) => [s.value, s.label]));

const fields: FieldDef[] = [
  { name: "title", label: "כותרת ההצעה", type: "text", required: true },
  { name: "customer_id", label: "לקוח", type: "lookup", lookupTable: "customers", labelField: "name" },
  { name: "quote_number", label: "מספר הצעה", type: "text" },
  { name: "total_amount", label: "סכום כולל (₪)", type: "number" },
  { name: "status", label: "סטטוס", type: "select", options: statusOptions, required: true },
  { name: "valid_until", label: "תוקף עד", type: "date" },
  { name: "description", label: "תיאור", type: "textarea" },
  { name: "notes", label: "הערות פנימיות", type: "textarea" },
];

function QuotesPage() {
  const { data: customers = [] } = useQuery({
    queryKey: ["lookup", "customers"],
    queryFn: async () => (await supabase.from("customers").select("id, name")).data ?? [],
  });
  const customerMap = new Map(customers.map((c: any) => [c.id, c.name]));

  return (
    <CrudPage
      title="הצעות מחיר"
      subtitle="הפק ונהל הצעות מחיר ללקוחות"
      table="quotes"
      fields={fields}
      searchKeys={["title", "quote_number", "description"]}
      renderCard={(item, actions) => (
        <article key={item.id} className="glass rounded-2xl p-4 hover:border-primary/40 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{item.title}</h3>
              {item.quote_number && (
                <p className="text-xs text-muted-foreground mt-0.5">#{item.quote_number}</p>
              )}
            </div>
            {actions}
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {item.customer_id && (
              <div className="flex items-center gap-2"><Users className="size-3" />{customerMap.get(item.customer_id) ?? "—"}</div>
            )}
            {item.valid_until && (
              <div className="flex items-center gap-2"><Calendar className="size-3" />בתוקף עד {item.valid_until}</div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <StatusPill label={statusLabel[item.status] ?? item.status} tone={statusTone[item.status]} />
            {item.total_amount != null && (
              <span className="text-sm font-bold gradient-text">₪{Number(item.total_amount).toLocaleString()}</span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3 glass"
            onClick={() => toast.info("ייצוא PDF יתווסף בקרוב")}
          >
            <FileText className="size-3.5 ml-1" />
            ייצוא להצעה
          </Button>
        </article>
      )}
    />
  );
}

export const Route = createFileRoute("/_authenticated/quotes")({
  component: QuotesPage,
});
