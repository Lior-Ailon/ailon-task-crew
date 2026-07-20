export function normalizeIsraeliPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return digits;
}

export function whatsappUrl(raw?: string | null): string | null {
  const n = normalizeIsraeliPhone(raw);
  return n ? `https://wa.me/${n}` : null;
}

export const LOST_REASONS: { value: string; label: string }[] = [
  { value: "price", label: "מחיר" },
  { value: "timing", label: "תזמון לא מתאים" },
  { value: "competitor", label: "בחר מתחרה" },
  { value: "no_response", label: "אין מענה" },
  { value: "not_relevant", label: "לא רלוונטי" },
  { value: "other", label: "אחר" },
];

export const LOST_REASON_LABEL: Record<string, string> = Object.fromEntries(
  LOST_REASONS.map((r) => [r.value, r.label]),
);

export function leadsToCsv(rows: any[]): string {
  const headers = ["name", "company", "email", "phone", "source", "status", "estimated_value", "notes"];
  const escape = (v: any) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => escape(r[h])).join(","));
  return "\ufeff" + lines.join("\n");
}

export function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^\ufeff/, "");
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"' && clean[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (field !== "" || cur.length) { cur.push(field); rows.push(cur); cur = []; field = ""; }
        if (c === "\r" && clean[i + 1] === "\n") i++;
      } else field += c;
    }
  }
  if (field !== "" || cur.length) { cur.push(field); rows.push(cur); }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).filter((r) => r.some((v) => v.trim() !== "")).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => (o[h] = (r[i] ?? "").trim()));
    return o;
  });
}
