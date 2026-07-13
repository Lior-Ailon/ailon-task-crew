import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, UserPlus, Check } from "lucide-react";

interface Props {
  name: string;
  defaultValue?: string[];
  placeholder?: string;
}

export function UserTagsInput({ name, defaultValue = [], placeholder }: Props) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p: any) => {
      if (selected.includes(p.email) || selected.includes(p.full_name)) return false;
      if (!q) return true;
      return (
        (p.full_name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [profiles, query, selected]);

  function add(val: string) {
    const v = val.trim();
    if (!v || selected.includes(v)) return;
    setSelected([...selected, v]);
    setQuery("");
  }

  function remove(val: string) {
    setSelected(selected.filter((s) => s !== val));
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={selected.join("\n")} />

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/15 text-accent text-xs border border-accent/30"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                className="hover:bg-accent/25 rounded-full p-0.5"
                aria-label="הסר"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (query.trim()) add(query);
              }
            }}
            placeholder={placeholder ?? "חפש משתמש או הקלד אימייל…"}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => query.trim() && add(query)}
            title="הוסף"
          >
            <UserPlus className="size-4" />
          </Button>
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full glass-strong rounded-xl border border-border/50 shadow-lg max-h-56 overflow-y-auto">
            {filtered.slice(0, 8).map((p: any) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(p.email || p.full_name);
                }}
                className="w-full text-right px-3 py-2 hover:bg-accent/10 flex items-center justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.full_name || "ללא שם"}</div>
                  {p.email && <div className="text-[11px] text-muted-foreground truncate">{p.email}</div>}
                </div>
                <Check className="size-3.5 opacity-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
