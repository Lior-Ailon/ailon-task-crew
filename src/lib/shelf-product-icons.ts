import type { ComponentType } from "react";
import {
  Package,
  GraduationCap,
  Calculator,
  CircleDot,
  MessagesSquare,
  Search,
  CalendarCheck,
  Compass,
  ClipboardList,
  CalendarDays,
  Users,
  Receipt,
  DoorOpen,
} from "lucide-react";

export interface AppIconConfig {
  icon: ComponentType<{ className?: string }>;
  gradient: string;
  iconColor: string;
  watermark: string;
}

export const appIcons: Record<string, AppIconConfig> = {
  "Mentor-IT": {
    icon: GraduationCap,
    gradient: "bg-gradient-to-br from-indigo-500/20 to-violet-500/10",
    iconColor: "text-indigo-500",
    watermark: "from-indigo-500/[0.06]",
  },
  "תורת הפתרונות": {
    icon: Calculator,
    gradient: "bg-gradient-to-br from-blue-500/20 to-cyan-500/10",
    iconColor: "text-blue-500",
    watermark: "from-blue-500/[0.06]",
  },
  "מעגל החיים": {
    icon: CircleDot,
    gradient: "bg-gradient-to-br from-emerald-500/20 to-teal-500/10",
    iconColor: "text-emerald-500",
    watermark: "from-emerald-500/[0.06]",
  },
  "מודל שיחת הקואצ'ינג": {
    icon: MessagesSquare,
    gradient: "bg-gradient-to-br from-amber-500/20 to-orange-500/10",
    iconColor: "text-amber-500",
    watermark: "from-amber-500/[0.06]",
  },
  "מוצא חוזקות": {
    icon: Search,
    gradient: "bg-gradient-to-br from-rose-500/20 to-pink-500/10",
    iconColor: "text-rose-500",
    watermark: "from-rose-500/[0.06]",
  },
  "ש.ק.ו.פ": {
    icon: CalendarCheck,
    gradient: "bg-gradient-to-br from-lime-500/20 to-green-500/10",
    iconColor: "text-lime-600",
    watermark: "from-lime-500/[0.06]",
  },
  "מצפן הקריירה": {
    icon: Compass,
    gradient: "bg-gradient-to-br from-cyan-500/20 to-sky-500/10",
    iconColor: "text-cyan-600",
    watermark: "from-cyan-500/[0.06]",
  },
  "Exam Tiuuch": {
    icon: ClipboardList,
    gradient: "bg-gradient-to-br from-purple-500/20 to-violet-500/10",
    iconColor: "text-purple-500",
    watermark: "from-purple-500/[0.06]",
  },
  "לוז שבועי": {
    icon: CalendarDays,
    gradient: "bg-gradient-to-br from-orange-500/20 to-amber-500/10",
    iconColor: "text-orange-500",
    watermark: "from-orange-500/[0.06]",
  },
  "Mini-CRM": {
    icon: Users,
    gradient: "bg-gradient-to-br from-slate-500/20 to-zinc-500/10",
    iconColor: "text-slate-500",
    watermark: "from-slate-500/[0.06]",
  },
  "החזרי הוצאות": {
    icon: Receipt,
    gradient: "bg-gradient-to-br from-green-500/20 to-emerald-500/10",
    iconColor: "text-green-600",
    watermark: "from-green-500/[0.06]",
  },
  "Exit Strategy AI": {
    icon: DoorOpen,
    gradient: "bg-gradient-to-br from-red-500/20 to-rose-500/10",
    iconColor: "text-red-500",
    watermark: "from-red-500/[0.06]",
  },
};

export function getAppIcon(name: string): AppIconConfig {
  return (
    appIcons[name] ?? {
      icon: Package,
      gradient: "bg-gradient-to-br from-primary/20 to-accent/10",
      iconColor: "text-accent",
      watermark: "from-primary/[0.06]",
    }
  );
}
