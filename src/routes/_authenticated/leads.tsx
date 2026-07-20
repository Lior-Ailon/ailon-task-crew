import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Building2, UserCheck, LayoutGrid, Bell, Download, Upload, Filter, XCircle, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendEntityNotification } from "@/lib/email/send-entity-notification";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LostReasonDialog } from "@/components/LostReasonDialog";
import { QuickContactActions } from "@/components/QuickContactActions";
import { LOST_REASON_LABEL, leadsToCsv, parseCsv } from "@/lib/lead-utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  { name: "assigned_to", label: "אחראי", type: "lookup", lookupTable: "profiles", labelField: "full_name" },
  { name: "next_follow_up_at", label: "מעקב הבא", type: "datetime-local" },
  { name: "follow_up_note", label: "הערת מעקב", type: "text" },
  { name: "notes", label: "הערות", type: "textarea" },
];

function LeadsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  const [convertTarget, setConvertTarget] = useState<any>(null);
  const [lostTarget, setLostTarget] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null)); }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ["lookup", "profiles"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, email").order("full_name")).data ?? [],
  });
  const profileById = useMemo(() => Object.fromEntries((profiles as any[]).map((p) => [p.id, p])), [profiles]);

  async function performConvert(lead: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("לא מחובר");
    const { data: created, error: insertErr } = await supabase.from("customers").insert({
      user_id: user.id,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes,
      source: lead.source,
      estimated_value: lead.estimated_value,
      lead_id: lead.id,
    } as any).select().maybeSingle();
    if (insertErr || !created) return toast.error(insertErr?.message ?? "שגיאה ביצירת לקוח");
    const { error: updErr } = await supabase.from("leads").update({
      status: "converted",
      converted_at: new Date().toISOString(),
      customer_id: (created as any).id,
    } as any).eq("id", lead.id);
    if (updErr) return toast.error(updErr.message);

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
    qc.invalidateQueries({ queryKey: ["customers"] });
    qc.invalidateQueries({ queryKey: ["count", "leads"] });
    qc.invalidateQueries({ queryKey: ["count", "customers"] });
    qc.invalidateQueries({ queryKey: ["lookup", "leads"] });
    qc.invalidateQueries({ queryKey: ["lookup", "customers"] });
    setConvertTarget(null);
  }

  async function handleAfterSave(event: "created" | "updated", payload: any, previous: any | null) {
    // If status is lost and no reason yet — prompt
    if (payload?.status === "lost" && !payload?.lost_reason) {
      setLostTarget(payload);
    }
  }

  async function applyLostReason(reason: string, note: string) {
    if (!lostTarget) return;
    const { error } = await supabase.from("leads").update({
      lost_reason: reason, lost_reason_note: note || null,
    } as any).eq("id", lostTarget.id);
    if (error) return toast.error(error.message);
    toast.success("סיבת האובדן נשמרה");
    qc.invalidateQueries({ queryKey: ["leads"] });
    setLostTarget(null);
  }

  async function handleExport() {
    const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    const csv = leadsToCsv(data ?? []);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result ?? ""));
        if (rows.length === 0) return toast.error("הקובץ ריק");
        setImportRows(rows);
        setImportOpen(true);
      } catch (err: any) {
        toast.error(err?.message ?? "שגיאה בקריאת קובץ");
      }
    };
    reader.readAsText(f, "utf-8");
    e.target.value = "";
  }

  async function confirmImport() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("לא מחובר");
    const rows = importRows.map((r) => ({
      user_id: user.id,
      name: r.name || r["שם"] || "ללא שם",
      company: r.company || null,
      email: r.email || null,
      phone: r.phone || null,
      source: r.source || null,
      estimated_value: r.estimated_value ? Number(r.estimated_value) : null,
      status: "new",
    }));
    const { error } = await supabase.from("leads").insert(rows as any);
    if (error) return toast.error(error.message);
    toast.success(`יובאו ${rows.length} לידים`);
    setImportOpen(false);
    setImportRows([]);
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["count", "leads"] });
  }

  return (
    <>
      <CrudPage
        title="לידים"
        subtitle="נהל את הלידים שלך ועקוב אחר התקדמותם"
        table="leads"
        fields={fields}
        searchKeys={["name", "company", "email"]}
        onAfterSave={handleAfterSave}
        onCardClick={(item) => navigate({ to: "/leads/$id", params: { id: item.id } })}
        filterItems={onlyMine ? (it) => it.assigned_to === currentUserId : undefined}
        extraHeader={
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-border/40">
              <Filter className="size-3.5" />
              <Label htmlFor="only-mine" className="text-xs cursor-pointer">הלידים שלי</Label>
              <Switch id="only-mine" checked={onlyMine} onCheckedChange={setOnlyMine} />
            </div>
            <input ref={fileRef} type="file" accept=".csv" onChange={onFilePicked} className="hidden" />
            <Button variant="outline" size="sm" className="glass" onClick={() => fileRef.current?.click()}>
              <Upload className="size-3.5 ml-1" /> ייבוא CSV
            </Button>
            <Button variant="outline" size="sm" className="glass" onClick={handleExport}>
              <Download className="size-3.5 ml-1" /> ייצוא CSV
            </Button>
            <Link to="/leads-board">
              <Button variant="outline" size="sm" className="glass">
                <LayoutGrid className="size-3.5 ml-1" /> תצוגת לוח
              </Button>
            </Link>
          </div>
        }
        renderCard={(item, actions) => {
          const followUpDate = item.next_follow_up_at ? new Date(item.next_follow_up_at) : null;
          const isOverdue = followUpDate && followUpDate < new Date();
          const assignee = item.assigned_to ? profileById[item.assigned_to] : null;
          return (
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
              <QuickContactActions email={item.email} phone={item.phone} className="mb-2" />
              {assignee && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                  <UserCircle2 className="size-3" /> אחראי: {assignee.full_name ?? assignee.email}
                </div>
              )}
              {followUpDate && (
                <div className={`mt-2 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full ${
                  isOverdue ? "bg-red-100 text-red-700 border border-red-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                }`}>
                  <Bell className="size-3" />
                  מעקב: {followUpDate.toLocaleDateString("he-IL")}
                </div>
              )}
              {item.status === "lost" && item.lost_reason && (
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
                  <XCircle className="size-3" /> {LOST_REASON_LABEL[item.lost_reason] ?? item.lost_reason}
                </div>
              )}
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
                  onClick={(e) => { e.stopPropagation(); setConvertTarget(item); }}
                >
                  <UserCheck className="size-3.5 ml-1" />
                  המר ללקוח
                </Button>
              )}
            </article>
          );
        }}
      />

      <AlertDialog open={!!convertTarget} onOpenChange={(o) => !o && setConvertTarget(null)}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle>המרת ליד ללקוח</AlertDialogTitle>
            <AlertDialogDescription>
              האם להמיר את "{convertTarget?.name}" ללקוח? הליד יישמר במערכת עם סטטוס "המיר" ויקושר לרשומת הלקוח שנוצרת.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => convertTarget && performConvert(convertTarget)}>
              המר ללקוח
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LostReasonDialog
        open={!!lostTarget}
        onOpenChange={(o) => !o && setLostTarget(null)}
        leadName={lostTarget?.name}
        onConfirm={applyLostReason}
      />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="glass-strong max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ייבוא לידים מ-CSV — תצוגה מקדימה ({importRows.length})</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground mb-2">עמודות נתמכות: name, company, email, phone, source, estimated_value</div>
          <div className="overflow-x-auto rounded-xl border border-border/40">
            <table className="w-full text-xs">
              <thead className="bg-muted/40">
                <tr>
                  {["name", "company", "email", "phone", "source", "estimated_value"].map((h) => (
                    <th key={h} className="p-2 text-start">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importRows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-t border-border/40">
                    {["name", "company", "email", "phone", "source", "estimated_value"].map((h) => (
                      <td key={h} className="p-2 truncate max-w-[150px]">{r[h] ?? "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {importRows.length > 20 && <div className="p-2 text-center text-xs text-muted-foreground">+ {importRows.length - 20} שורות נוספות</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>ביטול</Button>
            <Button onClick={confirmImport}>ייבא {importRows.length} לידים</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const Route = createFileRoute("/_authenticated/leads")({
  component: LeadsPage,
});
