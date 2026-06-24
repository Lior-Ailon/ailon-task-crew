import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Calendar, Flag } from "lucide-react";

const statusOptions = [
  { value: "todo", label: "לביצוע" },
  { value: "in_progress", label: "בתהליך" },
  { value: "done", label: "הושלם" },
];
const priorityOptions = [
  { value: "low", label: "נמוכה" },
  { value: "medium", label: "בינונית" },
  { value: "high", label: "גבוהה" },
  { value: "urgent", label: "דחופה" },
];
const statusTone: Record<string, any> = { todo: "slate", in_progress: "amber", done: "emerald" };
const statusLabel: Record<string, string> = Object.fromEntries(statusOptions.map((s) => [s.value, s.label]));
const priorityTone: Record<string, any> = { low: "slate", medium: "cyan", high: "amber", urgent: "red" };
const priorityLabel: Record<string, string> = Object.fromEntries(priorityOptions.map((s) => [s.value, s.label]));

const fields: FieldDef[] = [
  { name: "title", label: "כותרת", type: "text", required: true },
  { name: "description", label: "תיאור", type: "textarea" },
  { name: "status", label: "סטטוס", type: "select", options: statusOptions, required: true },
  { name: "priority", label: "עדיפות", type: "select", options: priorityOptions, required: true },
  { name: "due_date", label: "תאריך יעד", type: "date" },
];

export const Route = createFileRoute("/_authenticated/tasks")({
  component: () => (
    <CrudPage
      title="משימות"
      subtitle="כל המשימות הפתוחות והסגורות שלך"
      table="tasks"
      fields={fields}
      searchKeys={["title", "description"]}
      renderCard={(item, actions) => (
        <article key={item.id} className="glass rounded-2xl p-4 hover:border-accent/40 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{item.title}</h3>
              {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
            </div>
            {actions}
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-border/50">
            <StatusPill label={statusLabel[item.status] ?? item.status} tone={statusTone[item.status]} />
            <span className="flex items-center gap-1">
              <Flag className="size-3 text-muted-foreground" />
              <StatusPill label={priorityLabel[item.priority] ?? item.priority} tone={priorityTone[item.priority]} />
            </span>
            {item.due_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground mr-auto">
                <Calendar className="size-3" />{item.due_date}
              </span>
            )}
          </div>
        </article>
      )}
    />
  ),
});
