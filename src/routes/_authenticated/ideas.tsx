import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Lightbulb, Tag } from "lucide-react";

const statusOptions = [
  { value: "new", label: "חדש" },
  { value: "in_review", label: "בבדיקה" },
  { value: "approved", label: "אושר" },
  { value: "rejected", label: "נדחה" },
  { value: "implemented", label: "מומש" },
];
const statusTone: Record<string, any> = {
  new: "blue", in_review: "amber", approved: "cyan", rejected: "red", implemented: "emerald",
};
const statusLabel: Record<string, string> = Object.fromEntries(statusOptions.map((s) => [s.value, s.label]));

const priorityOptions = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
];
const priorityTone: Record<string, any> = { low: "slate", medium: "purple", high: "red" };
const priorityLabel: Record<string, string> = Object.fromEntries(priorityOptions.map((p) => [p.value, p.label]));

const fields: FieldDef[] = [
  { name: "title", label: "כותרת הרעיון", type: "text", required: true },
  { name: "description", label: "תיאור", type: "textarea" },
  { name: "category", label: "קטגוריה", type: "text" },
  { name: "status", label: "סטטוס", type: "select", options: statusOptions, required: true },
  { name: "priority", label: "עדיפות", type: "select", options: priorityOptions, required: true },
];

export const Route = createFileRoute("/_authenticated/ideas")({
  component: () => (
    <CrudPage
      title="רעיונות"
      subtitle="אסוף, נהל ופתח רעיונות חדשים לעסק"
      table="ideas"
      fields={fields}
      searchKeys={["title", "description", "category"]}
      renderCard={(item, actions) => (
        <article key={item.id} className="glass rounded-2xl p-4 hover:border-primary/40 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0 flex items-start gap-2">
              <div className="size-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shrink-0">
                <Lightbulb className="size-4 text-accent" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{item.title}</h3>
                {item.category && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Tag className="size-3" />{item.category}
                  </p>
                )}
              </div>
            </div>
            {actions}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{item.description}</p>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-border/50 gap-2">
            <StatusPill label={statusLabel[item.status] ?? item.status} tone={statusTone[item.status]} />
            <StatusPill label={priorityLabel[item.priority] ?? item.priority} tone={priorityTone[item.priority]} />
          </div>
        </article>
      )}
    />
  ),
});
