import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, StatusPill, type FieldDef } from "@/components/CrudPage";
import { Package, Tag, Boxes } from "lucide-react";

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
      searchKeys={["name", "sku", "category", "description"]}
      renderCard={(item, actions) => (
        <article
          key={item.id}
          className="glass-strong rounded-3xl p-4 hover:border-primary/40 transition-colors"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0 flex items-start gap-2">
              <div className="size-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center shrink-0">
                <Package className="size-4 text-accent" />
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
            {item.stock != null && (
              <div className="flex items-center gap-2">
                <Boxes className="size-3" />
                מלאי: {item.stock}
              </div>
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
