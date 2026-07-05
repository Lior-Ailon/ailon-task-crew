import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Plus, Pencil, Trash2, Search, Paperclip, Calendar, User, Download, Repeat } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const expensesTable = () => (supabase.from as any)("expenses");

function ExpensesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await expensesTable().select("*").order("expense_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = items.filter((it: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [it.expense_type, it.spender, it.notes].some((v) => String(v ?? "").toLowerCase().includes(q));
  });

  const total = items.reduce((s, i: any) => s + Number(i.amount ?? 0), 0);

  // חישוב עלות צפויה עד סוף השנה הקלנדרית לפי סוג התשלום
  function projectedUntilYearEnd(item: any): number {
    const amount = Number(item.amount ?? 0);
    if (!amount) return 0;
    const rec = item.recurrence ?? "one_time";
    const start = item.expense_date ? new Date(item.expense_date) : new Date();
    const now = new Date();
    const base = start > now ? start : now;
    const year = base.getFullYear();
    if (rec === "monthly") {
      const remainingMonths = 12 - base.getMonth(); // כולל החודש הנוכחי
      return amount * Math.max(0, remainingMonths);
    }
    if (rec === "yearly") {
      // תשלום שנתי - נספר פעם אחת השנה אם התאריך בשנה הנוכחית
      return start.getFullYear() === year ? amount : 0;
    }
    return amount;
  }

  const projectedTotal = items.reduce((s, i: any) => s + projectedUntilYearEnd(i), 0);


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const payload: Record<string, any> = {
        expense_date: fd.get("expense_date") || null,
        expense_type: fd.get("expense_type") || null,
        spender: fd.get("spender") || null,
        amount: fd.get("amount") ? Number(fd.get("amount")) : null,
        notes: fd.get("notes") || null,
        recurrence: fd.get("recurrence") || "one_time",
      };

      if (file) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("receipts").upload(path, file);
        if (upErr) throw upErr;
        payload.receipt_path = path;
      }

      if (editing) {
        const { error } = await expensesTable().update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("עודכן");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("לא מחובר");
        const { error } = await expensesTable().insert({ ...payload, user_id: user.id });
        if (error) throw error;
        toast.success("נוצר");
      }
      setOpen(false);
      setEditing(null);
      setFile(null);
      qc.invalidateQueries({ queryKey: ["expenses"] });
    } catch (err: any) {
      toast.error(err.message ?? "שגיאה");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("האם למחוק?")) return;
    const { error } = await expensesTable().delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("נמחק");
    qc.invalidateQueries({ queryKey: ["expenses"] });
  }

  async function openReceipt(path: string) {
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(path, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">הוצאות</h1>
          <p className="text-muted-foreground mt-1 text-sm">רישום הוצאות עם חשבוניות וקבלות מצורפות</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setFile(null); } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold">
              <Plus className="size-4 ml-1" />
              הוצאה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "עריכת הוצאה" : "הוצאה חדשה"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="expense_date">תאריך <span className="text-destructive">*</span></Label>
                <Input id="expense_date" name="expense_date" type="date" required defaultValue={editing?.expense_date ?? new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expense_type">סוג ההוצאה <span className="text-destructive">*</span></Label>
                <Input id="expense_type" name="expense_type" required defaultValue={editing?.expense_type ?? ""} placeholder="לדוגמה: משרד, שיווק, ציוד" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="spender">מוציא ההוצאה</Label>
                <Input id="spender" name="spender" defaultValue={editing?.spender ?? ""} placeholder="שם" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">סכום (₪)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" defaultValue={editing?.amount ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recurrence">סוג תשלום</Label>
                <Select name="recurrence" defaultValue={editing?.recurrence ?? "one_time"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">חד פעמי</SelectItem>
                    <SelectItem value="monthly">חודשי</SelectItem>
                    <SelectItem value="yearly">שנתי</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">הערות</Label>
                <Textarea id="notes" name="notes" rows={2} defaultValue={editing?.notes ?? ""} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="receipt">חשבונית / קבלה (קובץ מצורף)</Label>
                <Input id="receipt" type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {editing?.receipt_path && !file && (
                  <p className="text-xs text-muted-foreground">קובץ קיים: {editing.receipt_path} (העלה חדש להחלפה)</p>
                )}
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" disabled={uploading} className="bg-gradient-to-l from-primary to-accent text-primary-foreground font-semibold">
                  {uploading ? "שומר..." : editing ? "שמור שינויים" : "הוסף"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">סה״כ הוצאות</span>
        <span className="text-2xl font-bold text-red-600">₪{total.toLocaleString()}</span>
      </div>

      <div className="relative">
        <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="חיפוש..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 glass" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען...</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">{search ? "לא נמצאו תוצאות" : "אין הוצאות עדיין"}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item: any) => (
            <article key={item.id} className="glass rounded-2xl p-4 hover:border-primary/40 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{item.expense_type}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="size-3" />{item.expense_date}
                  </p>
                  {item.spender && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <User className="size-3" />{item.spender}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="size-8" onClick={() => { setEditing(item); setOpen(true); }}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-8 hover:text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              {item.notes && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.notes}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                {item.receipt_path ? (
                  <button onClick={() => openReceipt(item.receipt_path)} className="text-xs flex items-center gap-1 text-primary hover:underline">
                    <Paperclip className="size-3" /> צפייה בקבלה <Download className="size-3" />
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">אין קבלה</span>
                )}
                <span className="text-lg font-bold text-red-600">₪{Number(item.amount ?? 0).toLocaleString()}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesPage,
});
