import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Pencil, Trash2, Search, MoreHorizontal } from "lucide-react";
import { UserTagsInput } from "@/components/UserTagsInput";
import { toast } from "sonner";
import { sendEntityNotification, labelForTable } from "@/lib/email/send-entity-notification";
import { logActivity, diffFields, entityTypeFromTable } from "@/lib/activity";
import { STATUS_TONE_CLASS, type StatusTone } from "@/lib/status-colors";
import { confirmDialog } from "@/components/confirm-dialog";

export type FieldDef =
  | { name: string; label: string; type: "text" | "email" | "tel" | "number" | "date" | "datetime-local" | "textarea"; required?: boolean }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; required?: boolean }
  | { name: string; label: string; type: "lookup"; lookupTable: "customers" | "projects" | "profiles" | "leads"; labelField: string; required?: boolean }
  | { name: string; label: string; type: "tags"; placeholder?: string; required?: boolean }
  | { name: string; label: string; type: "user-tags"; placeholder?: string; required?: boolean }
  | { name: string; label: string; type: "duration"; startFieldName: string; endFieldName: string; options?: { value: number; label: string }[]; defaultMinutes?: number; required?: boolean };

export type TableName = "leads" | "customers" | "projects" | "tasks" | "meetings" | "ideas" | "subscriptions" | "quotes" | "shelf_products";

export interface CrudPageProps {
  title: string;
  subtitle?: string;
  table: TableName;
  fields: FieldDef[];
  renderCard: (item: any, actions: ReactNode) => ReactNode;
  searchKeys?: string[];
  extraHeader?: ReactNode;
  orderBy?: string;
  onAfterSave?: (event: "created" | "updated", payload: any, previous: any | null) => void;
  filterItems?: (item: any) => boolean;
  onCardClick?: (item: any) => void;
}

const PAGE_SIZE = 24;
type SortKey = "newest" | "oldest" | "name";

export function CrudPage({ title, subtitle, table, fields, renderCard, searchKeys = ["name", "title"], extraHeader, orderBy = "created_at", onAfterSave, filterItems, onCardClick }: CrudPageProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  const statusField = useMemo(
    () => fields.find((f) => f.name === "status" && f.type === "select") as
      | Extract<FieldDef, { type: "select" }>
      | undefined,
    [fields],
  );

  const nameKey = useMemo(
    () => (searchKeys.includes("name") ? "name" : searchKeys.includes("title") ? "title" : searchKeys[0] ?? "name"),
    [searchKeys],
  );

  const { data: items = [], isLoading } = useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order(orderBy, { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = (items as any[]).filter((it: any) => {
    if (filterItems && !filterItems(it)) return false;
    if (statusFilter !== "__all__" && it.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return searchKeys.some((k) => String(it[k] ?? "").toLowerCase().includes(q));
  });

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === "name") {
      arr.sort((a, b) => String(a[nameKey] ?? "").localeCompare(String(b[nameKey] ?? ""), "he"));
    } else if (sortKey === "oldest") {
      arr.sort((a, b) => new Date(a[orderBy] ?? 0).getTime() - new Date(b[orderBy] ?? 0).getTime());
    } else {
      arr.sort((a, b) => new Date(b[orderBy] ?? 0).getTime() - new Date(a[orderBy] ?? 0).getTime());
    }
    return arr;
  }, [filtered, sortKey, nameKey, orderBy]);

  const visible = sorted.slice(0, visibleCount);


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, any> = {};
    for (const f of fields) {
      const v = fd.get(f.name);
      if (f.type === "duration") {
        const minutes = Number(v);
        const startVal = String(fd.get(f.startFieldName) ?? "");
        if (startVal && Number.isFinite(minutes) && minutes > 0) {
          const start = new Date(startVal);
          const end = new Date(start.getTime() + minutes * 60 * 1000);
          payload[f.endFieldName] = end.toISOString();
        }
        // do not store duration itself
      } else if (f.type === "tags" || f.type === "user-tags") {
        const str = String(v ?? "");
        const arr = str
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean);
        payload[f.name] = arr;
      } else if (v === null || v === "") {
        payload[f.name] = null;
      } else if (f.type === "number") {
        payload[f.name] = Number(v);
      } else {
        payload[f.name] = v;
      }
    }

    const client = supabase.from(table) as any;
    if (editing) {
      const previous = editing;
      const { error } = await client.update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("עודכן בהצלחה");
      const merged = { ...previous, ...payload, id: editing.id };
      onAfterSave?.("updated", merged, previous);
      notifyEntity("updated", merged);
      recordActivity("updated", merged, previous);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return toast.error("לא מחובר");
      const { data: inserted, error } = await client.insert({ ...payload, user_id: user.id }).select().maybeSingle();
      if (error) return toast.error(error.message);
      toast.success("נוצר בהצלחה");
      const created = inserted ?? { ...payload, user_id: user.id };
      onAfterSave?.("created", created, null);
      notifyEntity("created", created);
      recordActivity("created", created, null);
    }
    setOpen(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: [table] });
    qc.invalidateQueries({ queryKey: ["count", table] });
  }

  async function recordActivity(event: "created" | "updated" | "deleted", record: any, previous: any | null) {
    const entityType = entityTypeFromTable(table);
    if (!entityType || !record?.id) return;
    const title = record?.title ?? record?.name ?? record?.subject ?? record?.quote_number ?? "—";
    if (event === "updated" && previous) {
      const changes = diffFields(previous, record);
      const statusChange = changes.find((c) => c.field === "status");
      if (statusChange) {
        await logActivity({
          entityType, entityId: record.id, action: "status_changed",
          description: `שינוי סטטוס: ${String(title)}`,
          metadata: { from: String(statusChange.from ?? "—"), to: String(statusChange.to ?? "—") },
        });
        return;
      }
      const summary = changes.slice(0, 3).map((c) => c.field).join(", ");
      await logActivity({
        entityType, entityId: record.id, action: "updated",
        description: summary ? `שדות: ${summary}` : String(title),
      });
    } else if (event === "created") {
      await logActivity({ entityType, entityId: record.id, action: "created", description: String(title) });
    } else {
      await logActivity({ entityType, entityId: record.id, action: "deleted", description: String(title) });
    }
  }

  async function notifyEntity(event: "created" | "updated" | "deleted", record: any) {
    const { data: { user } } = await supabase.auth.getUser();
    const actor = user?.email ?? undefined;
    const title = record?.title ?? record?.name ?? record?.subject ?? record?.quote_number ?? "—";
    const actionHe = event === "created" ? "נוצר" : event === "updated" ? "עודכן" : "נמחק";
    const fields: { label: string; value: string }[] = [];
    for (const f of ["status", "priority", "amount", "estimated_value", "total", "company", "email", "phone", "due_date", "start_time"]) {
      const v = record?.[f];
      if (v !== undefined && v !== null && v !== "") fields.push({ label: f, value: String(v) });
    }
    sendEntityNotification({
      entityLabel: labelForTable(table),
      action: actionHe,
      title: String(title),
      entityId: record?.id ?? "unknown",
      fields,
      actor,
    });
  }

  async function handleDelete(id: string) {
    const ok = await confirmDialog({ title: "מחיקה", description: "האם למחוק את הרשומה?", confirmText: "מחק", destructive: true });
    if (!ok) return;
    const target = items.find((it: any) => it.id === id);
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("נמחק");
    if (target) { notifyEntity("deleted", target); recordActivity("deleted", target, null); }
    qc.invalidateQueries({ queryKey: [table] });
    qc.invalidateQueries({ queryKey: ["count", table] });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold">
              <Plus className="size-4 ml-1" />
              חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "עריכה" : "הוספה חדשה"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              {fields.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={f.name}>
                    {f.label} {f.required && <span className="text-destructive">*</span>}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea id={f.name} name={f.name} required={f.required} defaultValue={editing?.[f.name] ?? ""} rows={3} />
                  ) : f.type === "select" ? (
                    <Select name={f.name} defaultValue={editing?.[f.name] ?? f.options[0]?.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {f.options.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : f.type === "lookup" ? (
                    <LookupSelect name={f.name} table={f.lookupTable} labelField={f.labelField} defaultValue={editing?.[f.name] ?? ""} />
                  ) : f.type === "tags" ? (
                    <Textarea
                      id={f.name}
                      name={f.name}
                      required={f.required}
                      placeholder={f.placeholder ?? "פריט בכל שורה, או מופרד בפסיקים"}
                      defaultValue={Array.isArray(editing?.[f.name]) ? editing[f.name].join("\n") : (editing?.[f.name] ?? "")}
                      rows={3}
                    />
                  ) : f.type === "user-tags" ? (
                    <UserTagsInput
                      name={f.name}
                      placeholder={f.placeholder}
                      defaultValue={Array.isArray(editing?.[f.name]) ? editing[f.name] : []}
                    />
                  ) : f.type === "duration" ? (
                    <DurationPicker
                      name={f.name}
                      options={f.options}
                      defaultMinutes={
                        editing?.[f.startFieldName] && editing?.[f.endFieldName]
                          ? Math.round(
                              (new Date(editing[f.endFieldName]).getTime() -
                                new Date(editing[f.startFieldName]).getTime()) /
                                60000,
                            )
                          : f.defaultMinutes ?? 60
                      }
                    />
                  ) : (
                    <Input
                      id={f.name}
                      name={f.name}
                      type={f.type}
                      required={f.required}
                      defaultValue={editing?.[f.name] ?? ""}
                      dir={f.type === "email" || f.type === "tel" ? "ltr" : undefined}
                    />
                  )}
                </div>
              ))}
              <DialogFooter className="pt-2">
                <Button type="submit" className="bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold">
                  {editing ? "שמור שינויים" : "הוסף"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {extraHeader}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
            className="pr-10 glass"
          />
        </div>
        {statusField && (
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setVisibleCount(PAGE_SIZE); }}>
            <SelectTrigger className="w-full sm:w-44 glass" aria-label="סינון סטטוס">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">כל הסטטוסים</SelectItem>
              {statusField.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-full sm:w-40 glass" aria-label="מיון">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">חדשים ראשונים</SelectItem>
            <SelectItem value="oldest">ישנים ראשונים</SelectItem>
            <SelectItem value="name">לפי שם</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען...</div>
      ) : sorted.length === 0 ? (
        <div className="glass-strong rounded-3xl p-12 text-center">
          <p className="text-muted-foreground">{search || statusFilter !== "__all__" ? "לא נמצאו תוצאות" : "אין נתונים עדיין. הוסף ראשון!"}</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((item: any) => {
              const handleActivate = () => {
                if (onCardClick) onCardClick(item);
                else setViewing(item);
              };
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={handleActivate}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleActivate(); } }}
                  className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl"
                >
                  {renderCard(
                    item,
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-10 sm:size-9"
                        onClick={(e) => { e.stopPropagation(); setEditing(item); setOpen(true); }}
                        aria-label="עריכה"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-10 sm:size-9"
                            aria-label="פעולות נוספות"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            aria-label="מחיקה"
                            className="text-destructive focus:text-destructive"
                            onSelect={() => handleDelete(item.id)}
                          >
                            <Trash2 className="size-4 ml-2" /> מחק
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>,
                  )}
                </div>
              );
            })}
          </div>
          {visibleCount < sorted.length && (
            <div className="flex justify-center">
              <Button variant="outline" className="glass" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                טען עוד ({sorted.length - visibleCount})
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">
            מציג {visible.length} מתוך {sorted.length}
          </p>
        </>
      )}

      <DetailDialog
        item={viewing}
        fields={fields}
        onClose={() => setViewing(null)}
        onEdit={() => { if (viewing) { setEditing(viewing); setViewing(null); setOpen(true); } }}
      />
    </div>
  );
}

function DetailDialog({
  item,
  fields,
  onClose,
  onEdit,
}: {
  item: any | null;
  fields: FieldDef[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const heading = item?.title ?? item?.name ?? item?.subject ?? item?.quote_number ?? "פרטים";
  return (
    <Dialog open={!!item} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{String(heading)}</DialogTitle>
        </DialogHeader>
        {item && (
          <div className="space-y-3">
            {fields.map((f) => {
              if (f.type === "duration") return null;
              const raw = item[f.name];
              if (raw === null || raw === undefined || raw === "") return null;
              return (
                <div key={f.name} className="grid grid-cols-[7rem_1fr] gap-3 items-start border-b border-border/40 pb-2 last:border-b-0">
                  <div className="text-xs font-medium text-muted-foreground">{f.label}</div>
                  <div className="text-sm break-words">
                    {f.type === "select"
                      ? (f.options.find((o) => o.value === raw)?.label ?? String(raw))
                      : Array.isArray(raw)
                        ? raw.length
                          ? (
                              <div className="flex flex-wrap gap-1">
                                {raw.map((t: any, i: number) => (
                                  <span key={i} className="text-xs px-2 py-0.5 rounded-full tone-default">{String(t)}</span>
                                ))}
                              </div>
                            )
                          : "—"
                        : f.type === "textarea"
                          ? <p className="whitespace-pre-wrap">{String(raw)}</p>
                          : String(raw)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>סגור</Button>
          <Button onClick={onEdit} className="bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold">
            <Pencil className="size-4 ml-1" /> עריכה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function StatusPill({ label, tone = "default" }: { label: string; tone?: StatusTone }) {
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_TONE_CLASS[tone]}`}>{label}</span>;
}

const DEFAULT_DURATION_OPTIONS = [
  { value: 15, label: "15 ד'" },
  { value: 30, label: "30 ד'" },
  { value: 45, label: "45 ד'" },
  { value: 60, label: "שעה" },
  { value: 90, label: "1.5 שעות" },
  { value: 120, label: "2 שעות" },
];

function DurationPicker({
  name,
  options,
  defaultMinutes,
}: {
  name: string;
  options?: { value: number; label: string }[];
  defaultMinutes: number;
}) {
  const opts = options ?? DEFAULT_DURATION_OPTIONS;
  const [value, setValue] = useState<number>(defaultMinutes);
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <Button
            key={o.value}
            type="button"
            size="sm"
            variant={value === o.value ? "default" : "outline"}
            className={value === o.value ? "bg-gradient-to-l from-primary to-accent text-primary-foreground" : "glass"}
            onClick={() => setValue(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </>
  );
}

function LookupSelect({ name, table, labelField, defaultValue }: { name: string; table: "customers" | "projects" | "profiles" | "leads"; labelField: string; defaultValue?: string }) {
  const [value, setValue] = useState<string>(defaultValue || "__none__");
  const { data: options = [] } = useQuery({
    queryKey: ["lookup", table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select(`id, ${labelField}`).order(labelField);
      if (error) throw error;
      return data as Array<Record<string, any>>;
    },
  });
  return (
    <>
      <input type="hidden" name={name} value={value === "__none__" ? "" : value} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger><SelectValue placeholder="בחר..." /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— ללא —</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>{o[labelField] || "(ללא שם)"}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
