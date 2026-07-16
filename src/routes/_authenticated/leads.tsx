import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Mail, Phone, Building2, UserCheck, LayoutGrid, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendEntityNotification } from "@/lib/email/send-entity-notification";

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
  { name: "next_follow_up_at", label: "מעקב הבא", type: "datetime-local" },
  { name: "follow_up_note", label: "הערת מעקב", type: "text" },
  { name: "notes", label: "הערות", type: "textarea" },
];

function LeadsPage() {
  const qc = useQueryClient();

  async function convertToCustomer(lead: any) {
    if (!confirm(`להמיר את "${lead.name}" ללקוח?`)) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("לא מחובר");
    const { error: insertErr } = await supabase.from("customers").insert({
      user_id: user.id,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes,
    });
    if (insertErr) return toast.error(insertErr.message);
    const { error: delErr } = await supabase.from("leads").delete().eq("id", lead.id);
    if (delErr) return toast.error(delErr.message);
    toast.success("הליד הומר ללקוח בהצלחה");
    sendEntityNotification({
      entityLabel: "ליד", action: "הומר ללקוח", title: lead.name,
      entityId: lead.id, actor: user.email ?? undefined,
      fields: [
        ...(lead.company ? [{ label: "חברה", value: String(lead.company) }] : []),
        ...(lead.email ? [{ label: "אימייל", value: String(lead.email) }] : []),
      ],
    });
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["count", "leads"] });
    qc.invalidateQueries({ queryKey: ["lookup", "leads"] });
    qc.invalidateQueries({ queryKey: ["customers"] });
    qc.invalidateQueries({ queryKey: ["count", "customers"] });
    qc.invalidateQueries({ queryKey: ["lookup", "customers"] });
  }

  return (
    <CrudPage
      title="לידים"
      subtitle="נהל את הלידים שלך ועקוב אחר התקדמותם"
      table="leads"
      fields={fields}
      searchKeys={["name", "company", "email"]}
      renderCard={(item, actions) => (
        <article key={item.id} className="glass-strong rounded-3xl p-4 hover:border-primary/40 transition-colors">
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
          {item.status !== "converted" && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-3 glass"
              onClick={() => convertToCustomer(item)}
            >
              <UserCheck className="size-3.5 ml-1" />
              המר ללקוח
            </Button>
          )}
        </article>
      )}
    />
  );
}

export const Route = createFileRoute("/_authenticated/leads")({
  component: LeadsPage,
});
