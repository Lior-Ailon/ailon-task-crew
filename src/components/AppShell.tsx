import { Link, useRouterState, useNavigate, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Lightbulb,
  Repeat,
  FileText,
  LogOut,
  Menu,
  X,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/ailon-logo.png.asset.json";

const navItems = [
  { to: "/dashboard", label: "דשבורד", icon: LayoutDashboard, admin: false },
  { to: "/leads", label: "לידים", icon: UserPlus, admin: false },
  { to: "/customers", label: "לקוחות", icon: Users, admin: false },
  { to: "/projects", label: "פרויקטים", icon: FolderKanban, admin: false },
  { to: "/tasks", label: "משימות", icon: CheckSquare, admin: false },
  { to: "/meetings", label: "פגישות", icon: CalendarDays, admin: false },
  { to: "/quotes", label: "הצעות מחיר", icon: FileText, admin: false },
  { to: "/subscriptions", label: "מנויים", icon: Repeat, admin: false },
  { to: "/incomes", label: "הכנסות", icon: TrendingUp, admin: false },
  { to: "/expenses", label: "הוצאות", icon: TrendingDown, admin: false },
  { to: "/ideas", label: "רעיונות", icon: Lightbulb, admin: false },
  { to: "/settings", label: "הגדרות", icon: Settings, admin: true },
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("התנתקת בהצלחה");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 right-0 z-40 glass-strong border-l">
        <SidebarContent pathname={pathname} onSignOut={handleSignOut} />
      </aside>

      {/* Mobile Topbar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 glass-strong border-b h-14 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="AILON TASK" className="size-9 object-contain" />
          <span className="font-bold text-sm tracking-wider text-primary">AILON TASK</span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="size-9 rounded-lg glass flex items-center justify-center"
          aria-label="פתח תפריט"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-72 glass-strong border-l flex flex-col animate-in slide-in-from-right">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 left-3 size-9 rounded-lg glass flex items-center justify-center z-10"
              aria-label="סגור"
            >
              <X className="size-5" />
            </button>
            <SidebarContent
              pathname={pathname}
              onSignOut={handleSignOut}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 lg:mr-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarContent({
  pathname,
  onSignOut,
  onNavigate,
}: {
  pathname: string;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="p-6 border-b border-border/50">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
          <img src={logoAsset.url} alt="AILON TASK" className="size-12 object-contain drop-shadow-sm" />
          <div>
            <div className="font-bold text-base tracking-wider text-primary">AILON TASK</div>
            <div className="text-[10px] text-muted-foreground tracking-widest">CRM SYSTEM</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavList pathname={pathname} onNavigate={onNavigate} />
      </nav>

      <div className="p-4 border-t border-border/50">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="size-4" />
          <span>התנתק</span>
        </button>
      </div>
    </>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { data: roles } = useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return [];
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userRes.user.id);
      return (data ?? []).map((r: any) => r.role as string);
    },
    staleTime: 60_000,
  });
  const isAdmin = roles?.includes("admin") ?? false;

  return (
    <>
      {navItems
        .filter((i) => !i.admin || isAdmin)
        .map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-l from-primary/20 to-accent/10 text-foreground border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className={cn("size-4", active && "text-accent")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
    </>
  );
}
