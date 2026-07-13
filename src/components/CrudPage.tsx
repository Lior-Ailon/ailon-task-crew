import { useState, type ReactNode } from "react";
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
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { UserTagsInput } from "@/components/UserTagsInput";
import { toast } from "sonner";

export type FieldDef =
  | { name: string; label: string; type: "text" | "email" | "tel" | "number" | "date" | "datetime-local" | "textarea"; required?: boolean }
  | { name: string; label: string; type: "select"; options: { value: string; label: string }[]; required?: boolean }
  | { name: string; label: string; type: "lookup"; lookupTable: "customers" | "projects" | "profiles" | "leads"; labelField: string; required?: boolean }
  | { name: string; label: string; type: "tags"; placeholder?: string; required?: boolean }
  | { name: string; label: string; type: "user-tags"; placeholder?: string; required?: boolean };

export type TableName = "leads" | "customers" | "projects" | "tasks" | "meetings" | "ideas" | "subscriptions" | "quotes";

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
}

export function CrudPage({ title, subtitle, table, fields, renderCard, searchKeys = ["name", "title"], extraHeader, orderBy = "created_at", onAfterSave, filterItems }: CrudPageProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order(orderBy, { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = items.filter((it: any) => {
    if (filterItems && !filterItems(it)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return searchKeys.some((k) => String(it[k] ?? "").toLowerCase().includes(q));
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, any> = {};
    for (const f of fields) {
      const v = fd.get(f.name);
      if (f.type === "tags" || f.type === "user-tags") {
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
      onAfterSave?.("updated", { ...previous, ...payload, id: editing.id }, previous);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return toast.error("לא מחובר");
      const { data: inserted, error } = await client.insert({ ...payload, user_id: user.id }).select().maybeSingle();
      if (error) return toast.error(error.message);
      toast.success("נוצר בהצלחה");
      onAfterSave?.("created", inserted ?? { ...payload, user_id: user.id }, null);
    }
    setOpen(false);
    setEditing(null);
    qc.invalidateQueries({ queryKey: [table] });
    qc.invalidateQueries({ queryKey: ["count", table] });
  }

  async function handleDelete(id: string) {
    if (!confirm("האם למחוק?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("נמחק");
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
          <p className="text-muted-foreground">{search ? "לא נמצאו תוצאות" : "אין נתונים עדיין. הוסף ראשון!"}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item: any) =>
            renderCard(
              item,
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="size-8" onClick={() => { setEditing(item); setOpen(true); }}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="size-8 hover:text-destructive" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>,
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function StatusPill({ label, tone = "default" }: { label: string; tone?: "default" | "blue" | "purple" | "cyan" | "emerald" | "red" | "amber" | "slate" }) {
  const tones = {
    default: "bg-muted text-muted-foreground border border-border",
    blue: "bg-sky-100 text-sky-700 border border-sky-200",
    purple: "bg-violet-100 text-violet-700 border border-violet-200",
    cyan: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    emerald: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    red: "bg-red-100 text-red-700 border border-red-200",
    amber: "bg-amber-100 text-amber-700 border border-amber-200",
    slate: "bg-slate-100 text-slate-700 border border-slate-200",
  };
  return <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${tones[tone]}`}>{label}</span>;
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
