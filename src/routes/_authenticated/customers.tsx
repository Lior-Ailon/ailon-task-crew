import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, type FieldDef } from "@/components/CrudPage";
import { Mail, Phone, MapPin, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const fields: FieldDef[] = [
  { name: "name", label: "שם איש קשר", type: "text", required: true },
  { name: "company", label: "חברה", type: "text" },
  { name: "email", label: "אימייל", type: "email" },
  { name: "phone", label: "טלפון", type: "tel" },
  { name: "address", label: "כתובת", type: "text" },
  { name: "tax_id", label: "ח.פ / ע.מ", type: "text" },
  { name: "notes", label: "הערות", type: "textarea" },
];

export const Route = createFileRoute("/_authenticated/customers")({
  component: () => (
    <CrudPage
      title="לקוחות"
      subtitle="ספר הלקוחות המרכזי שלך"
      table="customers"
      fields={fields}
      searchKeys={["name", "company", "email", "tax_id"]}
      renderCard={(item, actions) => (
        <article key={item.id} className="glass rounded-2xl p-4 hover:border-accent/40 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center font-bold text-sm shrink-0">
                {item.name?.[0] ?? "?"}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{item.name}</h3>
                {item.company && <p className="text-xs text-muted-foreground truncate">{item.company}</p>}
              </div>
            </div>
            {actions}
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {item.email && <div className="flex items-center gap-2" dir="ltr"><Mail className="size-3" />{item.email}</div>}
            {item.phone && <div className="flex items-center gap-2" dir="ltr"><Phone className="size-3" />{item.phone}</div>}
            {item.address && <div className="flex items-center gap-2"><MapPin className="size-3" />{item.address}</div>}
            {item.tax_id && <div className="flex items-center gap-2"><FileText className="size-3" />{item.tax_id}</div>}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3 glass"
            onClick={() => toast.info("התממשקות לחשבונית ירוקה / iCount תתווסף בקרוב", { description: "שמרנו את הלקוח מוכן לחשבונית" })}
          >
            <Receipt className="size-3.5 ml-1" />
            הפק חשבונית
          </Button>
        </article>
      )}
    />
  ),
});
