import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

async function fetchNotificationSettings() {
  const { data } = await supabase
    .from("app_settings")
    .select("id, digest_enabled, immediate_notifications_enabled")
    .eq("id", "global")
    .maybeSingle();
  return data as any;
}

export function NotificationSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["notification-settings"], queryFn: fetchNotificationSettings });

  const digest = data?.digest_enabled ?? true;
  const immediate = data?.immediate_notifications_enabled ?? true;

  async function update(patch: Record<string, boolean>) {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ id: "global", ...patch } as any);
    if (error) return toast.error(error.message);
    toast.success("נשמר");
    qc.invalidateQueries({ queryKey: ["notification-settings"] });
    qc.invalidateQueries({ queryKey: ["app-settings"] });
  }

  return (
    <section className="glass-strong rounded-3xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="size-5 text-accent" />
        <h2 className="font-semibold">התראות מייל לצוות</h2>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/40 p-3">
        <div>
          <Label htmlFor="immediate-toggle" className="text-sm cursor-pointer">התראות מיידיות</Label>
          <p className="text-xs text-muted-foreground mt-1">
            נשלחות מיד עבור: ליד חדש, הצעת מחיר שאושרה, ומעקב שעבר את מועדו.
          </p>
        </div>
        <Switch
          id="immediate-toggle"
          checked={immediate}
          onCheckedChange={(v) => update({ immediate_notifications_enabled: v })}
        />
      </div>

      <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/40 p-3">
        <div>
          <Label htmlFor="digest-toggle" className="text-sm cursor-pointer">סיכום יומי (07:00)</Label>
          <p className="text-xs text-muted-foreground mt-1">
            כל שאר השינויים במערכת נאספים ונשלחים במייל אחד מדי בוקר בשעה 07:00.
          </p>
        </div>
        <Switch
          id="digest-toggle"
          checked={digest}
          onCheckedChange={(v) => update({ digest_enabled: v })}
        />
      </div>
    </section>
  );
}
