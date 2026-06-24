import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Calendar, DollarSign } from "lucide-react";

const statusOptions = [
  { value: "planning", label: "בתכנון" },
  { value: "active", label: "פעיל" },
  { value: "on_hold", label: "בהמתנה" },
  { value: "completed", label: "הושלם" },
  { value: "cancelled", label: "בוטל" },
];
const statusTone: Record<string, any> = {
  planning: "slate", active: "cyan", on_hold: "amber", completed: "emerald", cancelled: "red",
};
const statusLabel: Record<string, string> = Object.fromEntries(statusOptions.map((s) => [s.value, s.label]));

const fields: FieldDef[] = [
  { name: "name", label: "שם הפרויקט", type: "text", required: true },
  { name: "description", label: "תיאור", type: "textarea" },
  { name: "status", label: "סטטוס", type: "select", options: statusOptions, required: true },
  { name: "budget", label: "תקציב (₪)", type: "number" },
  { name: "start_date", label: "תאריך התחלה", type: "date" },
  { name: "end_date", label: "תאריך סיום", type: "date" },
];

export const Route = createFileRoute("/_authenticated/projects")({
  component: () => (
    <CrudPage
      title="פרויקטים"
      subtitle="עקוב אחר הפרויקטים והתקציבים שלך"
      table="projects"
      fields={fields}
      searchKeys={["name", "description"]}
      renderCard={(item, actions) => (
        <article key={item.id} className="glass rounded-2xl p-4 hover:border-primary/40 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{item.name}</h3>
              {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
            </div>
            {actions}
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {(item.start_date || item.end_date) && (
              <div className="flex items-center gap-2">
                <Calendar className="size-3" />
                {item.start_date ?? "?"} → {item.end_date ?? "?"}
              </div>
            )}
            {item.budget != null && (
              <div className="flex items-center gap-2">
                <DollarSign className="size-3" />
                ₪{Number(item.budget).toLocaleString()}
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-border/50">
            <StatusPill label={statusLabel[item.status] ?? item.status} tone={statusTone[item.status]} />
          </div>
        </article>
      )}
    />
  ),
});
