import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Plus, Pencil, Trash2, ArrowRightLeft, Activity as ActivityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityEntityType } from "@/lib/activity";

interface Props {
  entityType: ActivityEntityType;
  entityId: string;
  limit?: number;
}

const actionMeta: Record<string, { label: string; icon: any; color: string }> = {
  created: { label: "נוצר", icon: Plus, color: "bg-emerald-500/20 text-emerald-600" },
  updated: { label: "עודכן", icon: Pencil, color: "bg-sky-500/20 text-sky-600" },
  deleted: { label: "נמחק", icon: Trash2, color: "bg-red-500/20 text-red-600" },
  status_changed: { label: "שינוי סטטוס", icon: ArrowRightLeft, color: "bg-amber-500/20 text-amber-600" },
  converted: { label: "הומר ללקוח", icon: ArrowRightLeft, color: "bg-violet-500/20 text-violet-600" },
};

export function ActivityTimeline({ entityType, entityId, limit = 20 }: Props) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities", entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="glass-strong rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <ActivityIcon className="size-5 text-accent" />
        <h2 className="font-semibold">היסטוריית פעילות</h2>
        <span className="text-xs text-muted-foreground">({activities.length})</span>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">טוען...</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">אין פעילות עדיין</p>
      ) : (
        <ol className="relative ms-3 space-y-4 border-s-2 border-border/40 ps-5">
          {activities.map((a: any) => {
            const meta = actionMeta[a.action] ?? { label: a.action, icon: Clock, color: "bg-muted text-muted-foreground" };
            const Icon = meta.icon;
            return (
              <li key={a.id} className="relative">
                <span className={cn(
                  "absolute -start-8 flex items-center justify-center size-6 rounded-full ring-4 ring-background",
                  meta.color,
                )}>
                  <Icon className="size-3" />
                </span>
                <div className="glass rounded-2xl p-3 border border-border/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm">{meta.label}</div>
                    <time className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(a.created_at).toLocaleString("he-IL", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </time>
                  </div>
                  {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                  {a.metadata && typeof a.metadata === "object" && Object.keys(a.metadata).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(a.metadata).map(([k, v]) => (
                        <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 border border-border/40">
                          <span className="text-muted-foreground">{k}:</span> {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
