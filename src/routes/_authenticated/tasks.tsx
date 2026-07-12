import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Button } from "@/components/ui/button";
import { Calendar, Flag, User, Users, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  type FilterKey = "status" | "assignee" | "priority" | "due";
  const [filterBy, setFilterBy] = useState<FilterKey>("status");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dueFrom, setDueFrom] = useState<string>("");
  const [dueTo, setDueTo] = useState<string>("");

  const hasFilters =
    statusFilter !== "all" || assigneeFilter !== "all" || priorityFilter !== "all" || !!dueFrom || !!dueTo;

  function resetFilters() {
    setStatusFilter("all");
    setAssigneeFilter("all");
    setPriorityFilter("all");
    setDueFrom("");
    setDueTo("");
  }

  function filterItems(item: any) {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
    if (assigneeFilter !== "all") {
      if (assigneeFilter === "__none__") {
        if (item.assignee_id) return false;
      } else if (item.assignee_id !== assigneeFilter) return false;
    }
    if (dueFrom && (!item.due_date || item.due_date < dueFrom)) return false;
    if (dueTo && (!item.due_date || item.due_date > dueTo)) return false;
    return true;
  }

  const filterCategories: { key: FilterKey; label: string }[] = [
    { key: "status", label: "סטטוס" },
    { key: "assignee", label: "אחראי" },
    { key: "priority", label: "עדיפות" },
    { key: "due", label: "תאריך יעד" },
  ];


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
      filterItems={filterItems}
      extraHeader={
        <div className="glass-strong rounded-3xl p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs">סטטוס</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">אחראי</Label>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="__none__">— ללא אחראי —</SelectItem>
                {profiles.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name || p.email || "משתמש"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">עדיפות</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {priorityOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">תאריך יעד מ־</Label>
            <Input type="date" value={dueFrom} onChange={(e) => setDueFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">עד</Label>
            <div className="flex gap-2">
              <Input type="date" value={dueTo} onChange={(e) => setDueTo(e.target.value)} />
              {hasFilters && (
                <Button type="button" variant="ghost" size="icon" onClick={resetFilters} title="נקה סינון">
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      }
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
