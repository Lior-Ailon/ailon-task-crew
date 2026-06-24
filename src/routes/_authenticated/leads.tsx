import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Mail, Phone, Building2 } from "lucide-react";

const statusOptions = [
  { value: "new", label: "חדש" },
  { value: "contacted", label: "יצרנו קשר" },
  { value: "qualified", label: "מוכשר" },
  { value: "converted", label: "המיר" },
  { value: "lost", label: "אבוד" },
];
const statusTone: Record<string, any> = {
  new: "blue", contacted: "purple", qualified: "cyan", converted: "emerald", lost: "red",
};
const statusLabel: Record<string, string> = Object.fromEntries(statusOptions.map((s) => [s.value, s.label]));

const fields: FieldDef[] = [
  { name: "name", label: "שם", type: "text", required: true },
  { name: "company", label: "חברה", type: "text" },
  { name: "email", label: "אימייל", type: "email" },
  { name: "phone", label: "טלפון", type: "tel" },
  { name: "source", label: "מקור", type: "text" },
  { name: "status", label: "סטטוס", type: "select", options: statusOptions, required: true },
  { name: "estimated_value", label: "ערך משוער (₪)", type: "number" },
  { name: "notes", label: "הערות", type: "textarea" },
];

export const Route = createFileRoute("/_authenticated/leads")({
  component: () => (
    <CrudPage
      title="לידים"
      subtitle="נהל את הלידים שלך ועקוב אחר התקדמותם"
      table="leads"
      fields={fields}
      searchKeys={["name", "company", "email"]}
      renderCard={(item, actions) => (
        <article key={item.id} className="glass rounded-2xl p-4 hover:border-primary/40 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{item.name}</h3>
              {item.company && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building2 className="size-3" />{item.company}
                </p>
              )}
            </div>
            {actions}
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {item.email && <div className="flex items-center gap-2" dir="ltr"><Mail className="size-3" />{item.email}</div>}
            {item.phone && <div className="flex items-center gap-2" dir="ltr"><Phone className="size-3" />{item.phone}</div>}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <StatusPill label={statusLabel[item.status] ?? item.status} tone={statusTone[item.status]} />
            {item.estimated_value != null && (
              <span className="text-sm font-bold gradient-text">₪{Number(item.estimated_value).toLocaleString()}</span>
            )}
          </div>
        </article>
      )}
    />
  ),
});
