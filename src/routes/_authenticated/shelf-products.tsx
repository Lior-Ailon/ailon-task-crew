import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import {
  Package,
  Tag,
  Boxes,
  ExternalLink,
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
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "active", label: "פעיל" },
  { value: "out_of_stock", label: "אזל מהמלאי" },
  { value: "discontinued", label: "הופסק" },
];
const statusTone: Record<string, any> = {
  active: "emerald",
  out_of_stock: "amber",
  discontinued: "slate",
};
const statusLabel: Record<string, string> = Object.fromEntries(
  statusOptions.map((s) => [s.value, s.label]),
);

interface AppIconConfig {
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconColor: string;
  watermark: string;
}

const appIcons: Record<string, AppIconConfig> = {
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

function getAppIcon(name: string): AppIconConfig {
  return (
    appIcons[name] ?? {
      icon: Package,
      gradient: "bg-gradient-to-br from-primary/20 to-accent/10",
      iconColor: "text-accent",
      watermark: "from-primary/[0.06]",
    }
  );
}

const fields: FieldDef[] = [
  { name: "name", label: "שם המוצר", type: "text", required: true },
  { name: "sku", label: 'מק"ט', type: "text" },
  { name: "category", label: "קטגוריה", type: "text" },
  { name: "description", label: "תיאור", type: "textarea" },
  { name: "link", label: "קישור", type: "text" },
  { name: "price", label: "מחיר (₪)", type: "number" },
  { name: "cost", label: "עלות (₪)", type: "number" },
  { name: "stock", label: "מלאי", type: "number" },
  { name: "status", label: "סטטוס", type: "select", options: statusOptions, required: true },
  { name: "notes", label: "הערות", type: "textarea" },
];

function ShelfProductsPage() {
  return (
    <CrudPage
      title="מוצרי מדף"
      subtitle="ניהול קטלוג מוצרי המדף שלך"
      table="shelf_products"
      fields={fields}
      searchKeys={["name", "sku", "category", "description", "link"]}
      renderCard={(item, actions) => {
        const app = getAppIcon(item.name);
        const AppIcon = app.icon;
        const WatermarkIcon = app.icon;
        return (
          <article
            key={item.id}
            className={cn(
              "glass-strong rounded-3xl p-4 hover:border-primary/40 transition-colors relative overflow-hidden isolate",
            )}
          >
            <div
              className={cn(
                "absolute -top-6 -left-6 size-32 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-2xl pointer-events-none",
                app.watermark,
              )}
            />
            <WatermarkIcon
              className={cn(
                "absolute -bottom-4 -right-4 size-24 opacity-[0.07] rotate-12 pointer-events-none",
                app.iconColor,
              )}
              aria-hidden="true"
            />
            <div className="relative flex justify-between items-start mb-3">
              <div className="min-w-0 flex items-start gap-2">
                <div
                  className={cn(
                    "size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    app.gradient,
                  )}
                >
                  <AppIcon className={cn("size-5", app.iconColor)} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{item.name}</h3>
                  {item.sku && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Tag className="size-3" />
                      {item.sku}
                    </p>
                  )}
                </div>
              </div>
              {actions}
            </div>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
          )}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {item.category && (
              <div className="flex items-center gap-2">
                <Tag className="size-3" />
                {item.category}
              </div>
            )}
            {item.stock != null && item.stock !== 0 && (
              <div className="flex items-center gap-2">
                <Boxes className="size-3" />
                מלאי: {item.stock}
              </div>
            )}
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-primary hover:underline truncate"
              >
                <ExternalLink className="size-3 shrink-0" />
                <span className="truncate">פתח את הכלי</span>
              </a>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <StatusPill
              label={statusLabel[item.status] ?? item.status}
              tone={statusTone[item.status]}
            />
            {item.price != null && (
              <span className="text-sm font-bold gradient-text">
                ₪{Number(item.price).toLocaleString()}
              </span>
            )}
          </div>
        </article>
      )}
    />
  );
}

export const Route = createFileRoute("/_authenticated/shelf-products")({
  component: ShelfProductsPage,
});
