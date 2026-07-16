import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Mail, Phone, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

const columns: { key: LeadStatus; label: string; gradient: string; ring: string }[] = [
  { key: "new", label: "חדש", gradient: "from-sky-500/20 to-sky-500/5", ring: "ring-sky-400/40" },
  { key: "contacted", label: "יצרנו קשר", gradient: "from-violet-500/20 to-violet-500/5", ring: "ring-violet-400/40" },
  { key: "qualified", label: "מוכשר", gradient: "from-cyan-500/20 to-cyan-500/5", ring: "ring-cyan-400/40" },
  { key: "converted", label: "המיר", gradient: "from-emerald-500/20 to-emerald-500/5", ring: "ring-emerald-400/40" },
  { key: "lost", label: "אבוד", gradient: "from-red-500/20 to-red-500/5", ring: "ring-red-400/40" },
];

function LeadsBoardPage() {
  const qc = useQueryClient();
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function moveLead(leadId: string, newStatus: LeadStatus) {
    const lead = leads.find((l: any) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;
    // optimistic update
    qc.setQueryData(["leads"], (prev: any[] | undefined) =>
      (prev ?? []).map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)),
    );
    const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
    if (error) {
      toast.error(error.message);
      qc.invalidateQueries({ queryKey: ["leads"] });
      return;
    }
    toast.success(`עודכן ל"${columns.find((c) => c.key === newStatus)?.label}"`);
    qc.invalidateQueries({ queryKey: ["count", "leads"] });
  }

  const byStatus = (s: LeadStatus) => leads.filter((l: any) => (l.status ?? "new") === s);
  const totalValue = (s: LeadStatus) =>
    byStatus(s).reduce((sum, l: any) => sum + (Number(l.estimated_value) || 0), 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutGrid className="size-7 text-accent" /> לוח לידים
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">גרור כרטיסי לידים בין העמודות לעדכון סטטוס</p>
        </div>
        <Link to="/leads">
          <Button variant="outline" className="glass">
            <List className="size-4 ml-1" /> תצוגת רשימה
          </Button>
        </Link>
      </header>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">טוען...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {columns.map((col) => {
            const items = byStatus(col.key);
            const value = totalValue(col.key);
            const isDropTarget = dragOver === col.key;
            return (
              <div
                key={col.key}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.key); }}
                onDragLeave={() => setDragOver((c) => (c === col.key ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  const id = e.dataTransfer.getData("text/lead-id");
                  if (id) moveLead(id, col.key);
                }}
                className={cn(
                  "glass-strong rounded-3xl p-3 flex flex-col min-h-[400px] bg-gradient-to-b transition-all",
                  col.gradient,
                  isDropTarget && `ring-2 ${col.ring} scale-[1.01]`,
                )}
              >
                <div className="flex items-center justify-between px-2 pb-3 border-b border-border/40 mb-3">
                  <div>
                    <h2 className="font-semibold text-sm">{col.label}</h2>
                    <p className="text-[10px] text-muted-foreground">
                      {items.length} לידים {value > 0 && `· ₪${value.toLocaleString()}`}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-background/60">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                  {items.length === 0 ? (
                    <div className="text-center text-[11px] text-muted-foreground py-8 opacity-60">
                      גרור לכאן
                    </div>
                  ) : (
                    items.map((lead: any) => (
                      <article
                        key={lead.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/lead-id", lead.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className="glass rounded-2xl p-3 cursor-grab active:cursor-grabbing hover:border-accent/50 transition-colors border border-border/40"
                      >
                        <div className="font-medium text-sm truncate">{lead.name}</div>
                        {lead.company && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                            <Building2 className="size-3 shrink-0" />
                            <span className="truncate">{lead.company}</span>
                          </div>
                        )}
                        <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
                          {lead.email && (
                            <div className="flex items-center gap-1 truncate" dir="ltr">
                              <Mail className="size-3 shrink-0" /> <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-1" dir="ltr">
                              <Phone className="size-3 shrink-0" /> {lead.phone}
                            </div>
                          )}
                        </div>
                        {lead.estimated_value != null && (
                          <div className="mt-2 pt-2 border-t border-border/40 text-xs font-bold gradient-text">
                            ₪{Number(lead.estimated_value).toLocaleString()}
                          </div>
                        )}
                        {lead.next_follow_up_at && (
                          <div className={cn(
                            "mt-1 text-[10px] rounded-full px-2 py-0.5 inline-block",
                            new Date(lead.next_follow_up_at) < new Date()
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-amber-100 text-amber-700 border border-amber-200",
                          )}>
                            מעקב: {new Date(lead.next_follow_up_at).toLocaleDateString("he-IL")}
                          </div>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/leads-board")({
  component: LeadsBoardPage,
});
