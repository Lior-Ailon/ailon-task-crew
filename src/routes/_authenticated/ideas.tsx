import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Lightbulb, Tag, UserPlus, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { confirmDialog } from "@/components/confirm-dialog";
import { sendEntityNotification } from "@/lib/email/send-entity-notification";

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
  { name: "lead_id", label: "ליד משויך", type: "lookup", lookupTable: "leads", labelField: "name" },
  { name: "status", label: "סטטוס", type: "select", options: statusOptions, required: true },
  { name: "priority", label: "עדיפות", type: "select", options: priorityOptions, required: true },
];

function IdeasPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: leads = [] } = useQuery({
    queryKey: ["lookup", "leads"],
    queryFn: async () => (await supabase.from("leads").select("id, name")).data ?? [],
  });
  const leadMap = new Map(leads.map((l: any) => [l.id, l.name]));

  async function convertToProject(item: any) {
    const ok = await confirmDialog({ title: "המרת רעיון לפרויקט", description: `להפוך את הרעיון "${item.title}" לפרויקט חדש?`, confirmText: "המר" });
    if (!ok) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("לא מחובר");
    const { data: newProject, error: pErr } = await supabase.from("projects").insert({
      user_id: user.id,
      name: item.title,
      description: item.description ?? null,
      status: "planning",
    }).select().maybeSingle();
    if (pErr) return toast.error(pErr.message);
    const { error: iErr } = await supabase.from("ideas").update({ status: "implemented" }).eq("id", item.id);
    if (iErr) return toast.error(iErr.message);
    toast.success("הרעיון הפך לפרויקט בהצלחה");
    sendEntityNotification({
      entityLabel: "פרויקט",
      action: "נוצר מרעיון",
      title: item.title,
      entityId: newProject?.id ?? "unknown",
      fields: [{ label: "idea_id", value: String(item.id) }],
      actor: user.email ?? undefined,
    });
    sendEntityNotification({
      entityLabel: "רעיון",
      action: "מומש",
      title: item.title,
      entityId: item.id,
      fields: [{ label: "status", value: "implemented" }],
      actor: user.email ?? undefined,
    });
    qc.invalidateQueries({ queryKey: ["ideas"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["count", "projects"] });
    navigate({ to: "/projects" });
  }

  return (
    <CrudPage
      title="רעיונות"
      subtitle="אסוף, נהל ופתח רעיונות חדשים לעסק"
      table="ideas"
      fields={fields}
      searchKeys={["title", "description", "category"]}
      renderCard={(item, actions) => (
        <article key={item.id} className="glass-strong rounded-3xl p-4 hover:border-primary/40 transition-colors">
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
          {item.lead_id && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <UserPlus className="size-3" />ליד: {leadMap.get(item.lead_id) ?? "—"}
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-border/50 gap-2">
            <div className="flex items-center gap-2">
              <StatusPill label={statusLabel[item.status] ?? item.status} tone={statusTone[item.status]} />
              <StatusPill label={priorityLabel[item.priority] ?? item.priority} tone={priorityTone[item.priority]} />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => convertToProject(item)}
              disabled={item.status === "implemented"}
              className="h-7 text-xs gap-1"
            >
              <Rocket className="size-3" />
              הפוך לפרויקט
            </Button>
          </div>
        </article>
      )}
    />
  );
}

export const Route = createFileRoute("/_authenticated/ideas")({
  component: IdeasPage,
});
