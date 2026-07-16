import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import {
  Search, UserPlus, Users, FolderKanban, CheckSquare, CalendarDays, FileText,
  Lightbulb, Repeat, TrendingUp, TrendingDown, Package, LayoutDashboard, LayoutGrid,
  BarChart3, Plus,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { to: "/analytics", label: "אנליטיקה ומכירות", icon: BarChart3 },
  { to: "/leads", label: "לידים", icon: UserPlus },
  { to: "/leads-board", label: "לוח לידים (Kanban)", icon: LayoutGrid },
  { to: "/customers", label: "לקוחות", icon: Users },
  { to: "/projects", label: "פרויקטים", icon: FolderKanban },
  { to: "/tasks", label: "משימות", icon: CheckSquare },
  { to: "/meetings", label: "פגישות", icon: CalendarDays },
  { to: "/quotes", label: "הצעות מחיר", icon: FileText },
  { to: "/subscriptions", label: "מנויים", icon: Repeat },
  { to: "/shelf-products", label: "מוצרי מדף", icon: Package },
  { to: "/incomes", label: "הכנסות", icon: TrendingUp },
  { to: "/expenses", label: "הוצאות", icon: TrendingDown },
  { to: "/ideas", label: "רעיונות", icon: Lightbulb },
] as const;

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Debounced search across entities
  const { data: results } = useQuery({
    queryKey: ["global-search", q],
    enabled: q.length >= 2,
    queryFn: async () => {
      const like = `%${q}%`;
      const [leads, customers, projects, tasks] = await Promise.all([
        supabase.from("leads").select("id, name, company").or(`name.ilike.${like},company.ilike.${like},email.ilike.${like}`).limit(5),
        supabase.from("customers").select("id, name, company").or(`name.ilike.${like},company.ilike.${like},email.ilike.${like}`).limit(5),
        supabase.from("projects").select("id, name").ilike("name", like).limit(5),
        supabase.from("tasks").select("id, title").ilike("title", like).limit(5),
      ]);
      return {
        leads: leads.data ?? [],
        customers: customers.data ?? [],
        projects: projects.data ?? [],
        tasks: tasks.data ?? [],
      };
    },
  });

  function go(to: string, params?: Record<string, string>) {
    setOpen(false);
    navigate({ to: to as any, params: params as any });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 h-9 rounded-lg glass border border-border/40 text-sm text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors w-full max-w-xs"
        aria-label="חיפוש"
      >
        <Search className="size-4" />
        <span className="flex-1 text-right">חיפוש...</span>
        <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded bg-muted/60 border border-border/40 font-mono">⌘K</kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command shouldFilter={false}>
          <CommandInput placeholder="חפש לידים, לקוחות, פרויקטים, משימות או דפים..." value={q} onValueChange={setQ} />
          <CommandList>
            <CommandEmpty>{q.length < 2 ? "הקלד לפחות 2 תווים" : "לא נמצאו תוצאות"}</CommandEmpty>

            {results?.leads.length ? (
              <CommandGroup heading="לידים">
                {results.leads.map((l: any) => (
                  <CommandItem key={l.id} value={`lead-${l.id}`} onSelect={() => go("/leads")}>
                    <UserPlus className="size-4 ml-2" />
                    <span>{l.name}</span>
                    {l.company && <span className="text-xs text-muted-foreground mr-2">· {l.company}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {results?.customers.length ? (
              <CommandGroup heading="לקוחות">
                {results.customers.map((c: any) => (
                  <CommandItem key={c.id} value={`customer-${c.id}`} onSelect={() => go("/customers/$id", { id: c.id })}>
                    <Users className="size-4 ml-2" />
                    <span>{c.name}</span>
                    {c.company && <span className="text-xs text-muted-foreground mr-2">· {c.company}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {results?.projects.length ? (
              <CommandGroup heading="פרויקטים">
                {results.projects.map((p: any) => (
                  <CommandItem key={p.id} value={`project-${p.id}`} onSelect={() => go("/projects")}>
                    <FolderKanban className="size-4 ml-2" />
                    <span>{p.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {results?.tasks.length ? (
              <CommandGroup heading="משימות">
                {results.tasks.map((t: any) => (
                  <CommandItem key={t.id} value={`task-${t.id}`} onSelect={() => go("/tasks")}>
                    <CheckSquare className="size-4 ml-2" />
                    <span>{t.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            <CommandSeparator />

            <CommandGroup heading="ניווט">
              {navItems.map((n) => (
                <CommandItem key={n.to} value={`nav-${n.to}`} onSelect={() => go(n.to)}>
                  <n.icon className="size-4 ml-2" />
                  <span>{n.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="פעולות מהירות">
              <CommandItem value="quick-lead" onSelect={() => go("/leads")}>
                <Plus className="size-4 ml-2" />
                <span>ליד חדש</span>
              </CommandItem>
              <CommandItem value="quick-customer" onSelect={() => go("/customers")}>
                <Plus className="size-4 ml-2" />
                <span>לקוח חדש</span>
              </CommandItem>
              <CommandItem value="quick-task" onSelect={() => go("/tasks")}>
                <Plus className="size-4 ml-2" />
                <span>משימה חדשה</span>
              </CommandItem>
              <CommandItem value="quick-meeting" onSelect={() => go("/meetings")}>
                <Plus className="size-4 ml-2" />
                <span>פגישה חדשה</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
