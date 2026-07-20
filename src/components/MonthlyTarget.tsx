import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Target } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

async function fetchSettings() {
  const { data } = await supabase.from("app_settings").select("*").eq("id", "global").maybeSingle();
  return data as { id: string; monthly_sales_target: number | null } | null;
}

async function fetchConvertedThisMonth() {
  const start = new Date();
  start.setDate(1); start.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("leads")
    .select("estimated_value, converted_at")
    .eq("status", "converted")
    .gte("converted_at", start.toISOString());
  return (data ?? []).reduce((s: number, r: any) => s + (Number(r.estimated_value) || 0), 0);
}

export function useMonthlyTarget() {
  const settings = useQuery({ queryKey: ["app-settings"], queryFn: fetchSettings });
  const actual = useQuery({ queryKey: ["converted-this-month"], queryFn: fetchConvertedThisMonth });
  const target = Number(settings.data?.monthly_sales_target ?? 0);
  const actualVal = actual.data ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((actualVal / target) * 100)) : 0;
  return { target, actual: actualVal, pct, isLoading: settings.isLoading || actual.isLoading };
}

export function MonthlyTargetCard({ compact = false }: { compact?: boolean }) {
  const { target, actual, pct } = useMonthlyTarget();
  const monthLabel = new Date().toLocaleDateString("he-IL", { month: "long" });
  return (
    <section className={cn("glass-strong rounded-3xl p-5", compact && "p-4")}>
      <div className="flex items-center gap-2 mb-3">
        <Target className={cn("text-accent", compact ? "size-4" : "size-5")} />
        <h2 className={cn("font-semibold", compact && "text-sm")}>יעד מכירות · {monthLabel}</h2>
        <span className="mr-auto text-xs text-muted-foreground">{pct}%</span>
      </div>
      {target === 0 ? (
        <p className="text-xs text-muted-foreground">לא הוגדר יעד. עדכן בהגדרות ← יעדים.</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between mb-2">
            <div className={cn("font-bold gradient-text", compact ? "text-xl" : "text-2xl")}>
              ₪{actual.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">מתוך ₪{target.toLocaleString()}</div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-primary to-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      )}
    </section>
  );
}

export function MonthlyTargetEditor() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({ queryKey: ["app-settings"], queryFn: fetchSettings });
  const [value, setValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.monthly_sales_target != null) setValue(String(settings.monthly_sales_target));
  }, [settings?.monthly_sales_target]);

  async function save() {
    setSaving(true);
    const num = Number(value) || 0;
    const { error } = await supabase.from("app_settings").upsert({ id: "global", monthly_sales_target: num } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("נשמר");
    qc.invalidateQueries({ queryKey: ["app-settings"] });
  }

  return (
    <section className="glass-strong rounded-3xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Target className="size-5 text-accent" />
        <h2 className="font-semibold">יעד מכירות חודשי</h2>
      </div>
      <p className="text-xs text-muted-foreground">היעד ישווה אל סך הערך המוערך של הלידים שהומרו ללקוחות בחודש הנוכחי.</p>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">יעד (₪)</label>
          <Input type="number" min="0" step="100" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "שומר…" : "שמור יעד"}</Button>
      </div>
    </section>
  );
}
