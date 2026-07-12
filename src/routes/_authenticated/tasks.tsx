import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Button } from "@/components/ui/button";
import { Calendar, Flag, User, Users, Check } from "lucide-react";
import { toast } from "sonner";
import { sendTaskNotification } from "@/lib/email/send-task-notification";

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
  { name: "assignee_id", label: "אחראי", type: "lookup", lookupTable: "profiles", labelField: "full_name" },
  { name: "customer_id", label: "לקוח משויך", type: "lookup", lookupTable: "customers", labelField: "name" },
  { name: "project_id", label: "פרויקט משויך", type: "lookup", lookupTable: "projects", labelField: "name" },
];

function TasksPage() {
  const qc = useQueryClient();
  const { data: profiles = [] } = useQuery({
    queryKey: ["lookup", "profiles"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email")).data ?? [],
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["lookup", "customers"],
    queryFn: async () => (await supabase.from("customers").select("id, name")).data ?? [],
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["lookup", "projects"],
    queryFn: async () => (await supabase.from("projects").select("id, name")).data ?? [],
  });
  const profileMap = new Map(profiles.map((p: any) => [p.id, p.full_name || p.email || "משתמש"]));
  const customerMap = new Map(customers.map((c: any) => [c.id, c.name]));
  const projectMap = new Map(projects.map((p: any) => [p.id, p.name]));

  async function markDone(item: any) {
    const { error } = await supabase.from("tasks").update({ status: "done" }).eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("המשימה סומנה כהושלמה");
    const { data: { user } } = await supabase.auth.getUser();
    const actorName = user ? (profileMap.get(user.id) as string) ?? user.email ?? undefined : undefined;
    sendTaskNotification({
      eventLabel: "משימה בוצעה",
      taskId: item.id,
      taskTitle: item.title,
      taskDescription: item.description,
      status: "done",
      priority: item.priority,
      dueDate: item.due_date,
      assignee: item.assignee_id ? (profileMap.get(item.assignee_id) as string) : undefined,
      actor: actorName,
    });
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["count", "tasks"] });
    qc.invalidateQueries({ queryKey: ["recent-tasks"] });
  }

  async function handleAfterSave(event: "created" | "updated", payload: any, previous: any | null) {
    const { data: { user } } = await supabase.auth.getUser();
    const actorName = user ? (profileMap.get(user.id) as string) ?? user.email ?? undefined : undefined;
    let eventLabel = event === "created" ? "משימה נפתחה" : "משימה עודכנה";
    if (event === "updated" && previous && previous.status !== payload.status) {
      if (payload.status === "done") eventLabel = "משימה בוצעה";
      else if (previous.status !== "done" && payload.status === "todo") eventLabel = "משימה נפתחה מחדש";
    }
    sendTaskNotification({
      eventLabel,
      taskId: payload.id,
      taskTitle: payload.title,
      taskDescription: payload.description,
      status: payload.status,
      priority: payload.priority,
      dueDate: payload.due_date,
      assignee: payload.assignee_id ? (profileMap.get(payload.assignee_id) as string) : undefined,
      actor: actorName,
    });
  }

  return (
    <CrudPage
      title="משימות"
      subtitle="כל המשימות הפתוחות והסגורות שלך"
      table="tasks"
      fields={fields}
      searchKeys={["title", "description"]}
      onAfterSave={handleAfterSave}
      renderCard={(item, actions) => (
        <article key={item.id} className="glass-strong rounded-3xl p-4 hover:border-accent/40 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{item.title}</h3>
              {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
            </div>
            {actions}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {item.assignee_id && (
              <div className="flex items-center gap-1"><User className="size-3" />{profileMap.get(item.assignee_id) ?? "—"}</div>
            )}
            {item.customer_id && (
              <div className="flex items-center gap-1"><Users className="size-3" />{customerMap.get(item.customer_id) ?? "—"}</div>
            )}
            {item.project_id && (
              <div className="flex items-center gap-1">📁 {projectMap.get(item.project_id) ?? "—"}</div>
            )}
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
          {item.status !== "done" && (
            <Button
              size="sm"
              onClick={() => markDone(item)}
              className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <Check className="size-4 ml-1" />
              בוצע
            </Button>
          )}
        </article>
      )}
    />
  );
}

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});
