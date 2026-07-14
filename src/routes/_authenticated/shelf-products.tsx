import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import {
  Package,
  Tag,
  Boxes,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAppIcon } from "@/lib/shelf-product-icons";

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
            <div className="relative z-10">
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
            </div>
          </article>
        );
      }}
    />
  );
}

export const Route = createFileRoute("/_authenticated/shelf-products")({
  component: ShelfProductsPage,
});
