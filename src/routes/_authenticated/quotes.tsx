import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusPill } from "@/components/CrudPage";
import { sendEntityNotification } from "@/lib/email/send-entity-notification";
import { Users, Calendar, FileText, Plus, Pencil, Trash2, Search, X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import ailonLogo from "@/assets/ailon-logo.png.asset.json";

type Frequency = "one_time" | "monthly" | "yearly";
type QuoteModule = { id: string; title: string; description: string; cost: number; frequency: Frequency };

const frequencyOptions: { value: Frequency; label: string; short: string }[] = [
  { value: "one_time", label: "חד פעמי", short: "" },
  { value: "monthly", label: "חודשי", short: "/חודש" },
  { value: "yearly", label: "שנתי", short: "/שנה" },
];
const frequencyLabel: Record<Frequency, string> = Object.fromEntries(
  frequencyOptions.map((f) => [f.value, f.label]),
) as any;
const frequencyShort: Record<Frequency, string> = Object.fromEntries(
  frequencyOptions.map((f) => [f.value, f.short]),
) as any;

const statusOptions = [
  { value: "draft", label: "טיוטה" },
  { value: "sent", label: "נשלחה" },
  { value: "accepted", label: "אושרה" },
  { value: "rejected", label: "נדחתה" },
  { value: "expired", label: "פגה" },
];
const statusTone: Record<string, any> = { draft: "slate", sent: "blue", accepted: "emerald", rejected: "red", expired: "amber" };
const statusLabel: Record<string, string> = Object.fromEntries(statusOptions.map((s) => [s.value, s.label]));

function newModule(): QuoteModule {
  return { id: crypto.randomUUID(), title: "", description: "", cost: 0, frequency: "one_time" };
}

function printQuote(item: any, contactName?: string, contactKind?: "customer" | "lead") {
  const mods: QuoteModule[] = Array.isArray(item.modules) ? item.modules : [];
  const total = Number(item.total_amount ?? mods.reduce((s, m) => s + (Number(m.cost) || 0), 0));
  const statusLabels: Record<string, string> = {
    draft: "טיוטה", sent: "נשלחה", accepted: "אושרה", rejected: "נדחתה", expired: "פגה",
  };
  const esc = (s: any) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  const rows = mods.map((m, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <div class="mod-title">${esc(m.title) || "&mdash;"}</div>
        ${m.description ? `<div class="mod-desc">${esc(m.description)}</div>` : ""}
      </td>
      <td class="num">₪${Number(m.cost || 0).toLocaleString()}${esc(frequencyShort[(m.frequency as Frequency) || "one_time"] || "")}</td>
    </tr>`).join("");

  const contactLabel = contactKind === "lead" ? "ליד" : "לקוח";

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8" />
<title>הצעת מחיר ${esc(item.quote_number || item.title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", "Assistant", Arial, sans-serif; color: #111; margin: 0; padding: 32px; background: #fff; }
  .header { display: flex; justify-content: space-between; align-items: center; gap: 16px; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
  .brand { flex: 0 0 auto; }
  .logo { height: 72px; width: auto; display: block; }
  .header-main { flex: 1 1 auto; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  .meta { color: #555; font-size: 13px; }
  .meta div { margin: 2px 0; }
  .section { margin: 20px 0; }
  .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin: 0 0 8px; }
  .desc { white-space: pre-wrap; font-size: 14px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
  th, td { padding: 10px 12px; text-align: right; border-bottom: 1px solid #ddd; vertical-align: top; }
  th { background: #f5f5f5; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #444; }
  td.num, th.num { text-align: left; direction: ltr; white-space: nowrap; }
  .mod-title { font-weight: 600; }
  .mod-desc { font-size: 12px; color: #666; margin-top: 2px; white-space: pre-wrap; }
  .total { margin-top: 16px; display: flex; justify-content: space-between; padding: 14px 12px; background: #f5f5f5; border-radius: 6px; font-size: 16px; font-weight: 700; }
  .notes { margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 12px; color: #666; white-space: pre-wrap; }
  .closing { margin-top: 32px; font-size: 14px; color: #333; }
  @media print { body { padding: 0; } .no-print { display: none; } }
  .toolbar { position: fixed; top: 12px; left: 12px; }
  .toolbar button { padding: 8px 16px; font-size: 14px; cursor: pointer; }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">הדפס / שמור כ־PDF</button>
  </div>
  <div class="header">
    <div class="brand">
      <img src="${window.location.origin}${ailonLogo.url}" alt="Ailon Task" class="logo" />
    </div>
    <div class="header-main">
      <h1>${esc(item.title)}</h1>
      <div class="meta">
        ${item.quote_number ? `<div>מספר הצעה: ${esc(item.quote_number)}</div>` : ""}
        ${contactName ? `<div>${contactLabel}: ${esc(contactName)}</div>` : ""}
        ${item.valid_until ? `<div>בתוקף עד: ${esc(item.valid_until)}</div>` : ""}
      </div>
    </div>
    <div class="meta" style="text-align:left;">
      <div>סטטוס: ${esc(statusLabels[item.status] ?? item.status ?? "")}</div>
      <div>תאריך: ${new Date(item.created_at ?? Date.now()).toLocaleDateString("he-IL")}</div>
    </div>
  </div>

  ${item.description ? `<div class="section"><h2>תיאור</h2><div class="desc">${esc(item.description)}</div></div>` : ""}

  <div class="section">
    <h2>מודולים / סעיפים</h2>
    <table>
      <thead><tr><th style="width:40px;">#</th><th>פירוט</th><th class="num" style="width:140px;">עלות</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="3" style="text-align:center;color:#999;">אין סעיפים</td></tr>`}</tbody>
    </table>
  </div>

  <div class="total"><span>סכום כולל</span><span style="direction:ltr;">₪${total.toLocaleString()}</span></div>

  ${item.notes ? `<div class="notes"><strong>הערות:</strong><br/>${esc(item.notes)}</div>` : ""}

  <div class="closing">בברכה,<br/>צוות Ailon-Task</div>

  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 300));</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}


function QuotesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  // encoded contact: "__none__" | "customer:<id>" | "lead:<id>"
  const [contact, setContact] = useState<string>("__none__");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [status, setStatus] = useState("draft");
  const [validUntil, setValidUntil] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [modules, setModules] = useState<QuoteModule[]>([newModule()]);

  const { data: customers = [] } = useQuery({
    queryKey: ["lookup", "customers"],
    queryFn: async () => (await supabase.from("customers").select("id, name").order("name")).data ?? [],
  });
  const { data: leads = [] } = useQuery({
    queryKey: ["lookup", "leads"],
    queryFn: async () => (await supabase.from("leads").select("id, name").order("name")).data ?? [],
  });
  const customerMap = new Map(customers.map((c: any) => [c.id, c.name]));
  const leadMap = new Map(leads.map((l: any) => [l.id, l.name]));

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = items.filter((it: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return ["title", "quote_number", "description"].some((k) => String(it[k] ?? "").toLowerCase().includes(q));
  });

  const totalAmount = useMemo(
    () => modules.reduce((sum, m) => sum + (Number(m.cost) || 0), 0),
    [modules],
  );

  function resetForm() {
    setTitle("");
    setContact("__none__");
    setQuoteNumber("");
    setStatus("draft");
    setValidUntil("");
    setDescription("");
    setNotes("");
    setModules([newModule()]);
    setEditing(null);
  }

  function openForEdit(item: any) {
    setEditing(item);
    setTitle(item.title ?? "");
    setContact(
      item.customer_id ? `customer:${item.customer_id}` :
      item.lead_id ? `lead:${item.lead_id}` : "__none__",
    );
    setQuoteNumber(item.quote_number ?? "");
    setStatus(item.status ?? "draft");
    setValidUntil(item.valid_until ?? "");
    setDescription(item.description ?? "");
    setNotes(item.notes ?? "");
    const mods = Array.isArray(item.modules) && item.modules.length > 0
      ? item.modules.map((m: any) => ({
          id: m.id ?? crypto.randomUUID(),
          title: m.title ?? "",
          description: m.description ?? "",
          cost: Number(m.cost) || 0,
          frequency: (m.frequency as Frequency) ?? "one_time",
        }))
      : [newModule()];
    setModules(mods);
    setOpen(true);
  }

  function updateModule(id: string, patch: Partial<QuoteModule>) {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function addModule() {
    setModules((prev) => [...prev, newModule()]);
  }
  function removeModule(id: string) {
    setModules((prev) => (prev.length === 1 ? prev : prev.filter((m) => m.id !== id)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return toast.error("נדרשת כותרת");

    const cleanModules = modules
      .filter((m) => m.title.trim() || m.description.trim() || Number(m.cost) > 0)
      .map((m) => ({
        id: m.id,
        title: m.title.trim(),
        description: m.description.trim(),
        cost: Number(m.cost) || 0,
        frequency: m.frequency ?? "one_time",
      }));

    let customer_id: string | null = null;
    let lead_id: string | null = null;
    if (contact.startsWith("customer:")) customer_id = contact.slice("customer:".length);
    else if (contact.startsWith("lead:")) lead_id = contact.slice("lead:".length);

    const payload: Record<string, any> = {
      title: title.trim(),
      customer_id,
      lead_id,
      quote_number: quoteNumber.trim() || null,
      status,
      valid_until: validUntil || null,
      description: description.trim() || null,
      notes: notes.trim() || null,
      modules: cleanModules,
      total_amount: cleanModules.reduce((s, m) => s + m.cost, 0),
    };

    const client = supabase.from("quotes") as any;
    const { data: { user } } = await supabase.auth.getUser();
    const actor = user?.email ?? undefined;
    if (editing) {
      const { error } = await client.update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("עודכן בהצלחה");
      sendEntityNotification({
        entityLabel: "הצעת מחיר", action: "עודכן", title: payload.title,
        entityId: editing.id, actor,
        fields: [{ label: "סטטוס", value: String(payload.status) }, { label: "סכום", value: String(payload.total_amount) }],
      });
    } else {
      if (!user) return toast.error("לא מחובר");
      const { data: inserted, error } = await client.insert({ ...payload, user_id: user.id }).select().maybeSingle();
      if (error) return toast.error(error.message);
      toast.success("נוצר בהצלחה");
      sendEntityNotification({
        entityLabel: "הצעת מחיר", action: "נוצר", title: payload.title,
        entityId: inserted?.id ?? "unknown", actor,
        fields: [{ label: "סטטוס", value: String(payload.status) }, { label: "סכום", value: String(payload.total_amount) }],
      });
    }
    setOpen(false);
    resetForm();
    qc.invalidateQueries({ queryKey: ["quotes"] });
    qc.invalidateQueries({ queryKey: ["count", "quotes"] });
  }

  async function handleDelete(id: string) {
    if (!confirm("האם למחוק?")) return;
    const target = (items as any[]).find((q) => q.id === id);
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("נמחק");
    const { data: { user } } = await supabase.auth.getUser();
    sendEntityNotification({
      entityLabel: "הצעת מחיר", action: "נמחק", title: target?.title ?? "—",
      entityId: id, actor: user?.email ?? undefined,
    });
    qc.invalidateQueries({ queryKey: ["quotes"] });
  }

  function contactInfo(item: any): { name?: string; kind?: "customer" | "lead" } {
    if (item.customer_id) return { name: customerMap.get(item.customer_id), kind: "customer" };
    if (item.lead_id) return { name: leadMap.get(item.lead_id), kind: "lead" };
    return {};
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">הצעות מחיר</h1>
          <p className="text-muted-foreground mt-1 text-sm">הפק ונהל הצעות מחיר מודולריות ללקוחות</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold">
              <Plus className="size-4 ml-1" />
              חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "עריכת הצעת מחיר" : "הצעת מחיר חדשה"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>כותרת ההצעה <span className="text-destructive">*</span></Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>לקוח / ליד</Label>
                  <Select value={contact} onValueChange={setContact}>
                    <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— ללא —</SelectItem>
                      {customers.length > 0 && (
                        <div className="px-2 py-1 text-[10px] font-semibold text-emerald-600 uppercase">לקוחות</div>
                      )}
                      {customers.map((c: any) => (
                        <SelectItem key={`c-${c.id}`} value={`customer:${c.id}`}>
                          <span className="text-emerald-600 font-medium">● {c.name || "(ללא שם)"}</span>
                        </SelectItem>
                      ))}
                      {leads.length > 0 && (
                        <div className="px-2 py-1 text-[10px] font-semibold text-red-600 uppercase">לידים</div>
                      )}
                      {leads.map((l: any) => (
                        <SelectItem key={`l-${l.id}`} value={`lead:${l.id}`}>
                          <span className="text-red-600 font-medium">● {l.name || "(ללא שם)"}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>מספר הצעה</Label>
                  <Input value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>סטטוס <span className="text-destructive">*</span></Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>תוקף עד</Label>
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>תיאור כללי</Label>
                  <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">מודולים / סעיפים</Label>
                  <Button type="button" size="sm" variant="outline" className="glass" onClick={addModule}>
                    <Plus className="size-3.5 ml-1" />
                    הוסף מודול
                  </Button>
                </div>

                <div className="space-y-3">
                  {modules.map((m, idx) => (
                    <div key={m.id} className="glass rounded-xl p-3 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">מודול {idx + 1}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-7 hover:text-destructive"
                          onClick={() => removeModule(m.id)}
                          disabled={modules.length === 1}
                          aria-label="מחק מודול"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-[1fr_130px_130px] gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">כותרת / סוג</Label>
                          <Input
                            placeholder="למשל: פיתוח, עיצוב, תחזוקה"
                            value={m.title}
                            onChange={(e) => updateModule(m.id, { title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">עלות (₪)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={m.cost}
                            onChange={(e) => updateModule(m.id, { cost: Number(e.target.value) })}
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">תדירות</Label>
                          <Select
                            value={m.frequency}
                            onValueChange={(v) => updateModule(m.id, { frequency: v as Frequency })}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {frequencyOptions.map((f) => (
                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">פירוט</Label>
                        <Textarea
                          rows={2}
                          placeholder="תיאור מה כלול במודול זה..."
                          value={m.description}
                          onChange={(e) => updateModule(m.id, { description: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground">סכום כולל</span>
                  <span className="text-xl font-bold gradient-text">₪{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>הערות פנימיות</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <DialogFooter className="pt-2">
                <Button type="submit" className="bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold">
                  {editing ? "שמור שינויים" : "הוסף הצעה"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="relative">
        <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="חיפוש..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 glass"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-strong rounded-3xl p-12 text-center">
          <p className="text-muted-foreground">{search ? "לא נמצאו תוצאות" : "אין הצעות עדיין. הוסף ראשונה!"}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item: any) => {
            const mods: QuoteModule[] = Array.isArray(item.modules) ? item.modules : [];
            const c = contactInfo(item);
            const contactColor = c.kind === "lead" ? "text-red-600" : c.kind === "customer" ? "text-emerald-600" : "";
            return (
              <article
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => openForEdit(item)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openForEdit(item); } }}
                className="glass-strong rounded-3xl p-4 hover:border-primary/40 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    {item.quote_number && (
                      <p className="text-xs text-muted-foreground mt-0.5">#{item.quote_number}</p>
                    )}
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="size-8" onClick={(e) => { e.stopPropagation(); printQuote(item, c.name, c.kind); }} aria-label="הדפס">
                      <Printer className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {c.name && (
                    <div className={`flex items-center gap-2 font-medium ${contactColor}`}>
                      <Users className="size-3" />
                      {c.name}
                      <span className="text-[10px] opacity-70">({c.kind === "lead" ? "ליד" : "לקוח"})</span>
                    </div>
                  )}
                  {item.valid_until && (
                    <div className="flex items-center gap-2"><Calendar className="size-3" />בתוקף עד {item.valid_until}</div>
                  )}
                  {mods.length > 0 && (
                    <div className="flex items-center gap-2"><FileText className="size-3" />{mods.length} מודולים</div>
                  )}
                </div>
                {mods.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs">
                    {mods.slice(0, 3).map((m) => (
                      <li key={m.id} className="flex justify-between gap-2">
                        <span className="truncate">{m.title || "(ללא כותרת)"}</span>
                        <span className="text-muted-foreground shrink-0">
                          ₪{Number(m.cost).toLocaleString()}{frequencyShort[(m.frequency as Frequency) || "one_time"]}
                        </span>
                      </li>
                    ))}
                    {mods.length > 3 && (
                      <li className="text-muted-foreground">+{mods.length - 3} נוספים</li>
                    )}
                  </ul>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <StatusPill label={statusLabel[item.status] ?? item.status} tone={statusTone[item.status]} />
                  {item.total_amount != null && (
                    <span className="text-sm font-bold gradient-text">₪{Number(item.total_amount).toLocaleString()}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/quotes")({
  component: QuotesPage,
});
