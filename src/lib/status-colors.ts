// Shared status label + color mapping. Keep DB values in English; render Hebrew.
export type StatusTone =
  | "default" | "blue" | "purple" | "cyan" | "emerald" | "red" | "amber" | "slate";

export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  default: "bg-muted text-muted-foreground border border-border",
  blue: "bg-sky-100 text-sky-700 border border-sky-200",
  purple: "bg-violet-100 text-violet-700 border border-violet-200",
  cyan: "bg-cyan-100 text-cyan-700 border border-cyan-200",
  emerald: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  red: "bg-red-100 text-red-700 border border-red-200",
  amber: "bg-amber-100 text-amber-700 border border-amber-200",
  slate: "bg-slate-100 text-slate-700 border border-slate-200",
};

export const SOFT_OVERDUE = "bg-red-100 text-red-700 border border-red-200";
export const SOFT_UPCOMING = "bg-amber-100 text-amber-700 border border-amber-200";

export const LEAD_STATUS_LABEL: Record<string, string> = {
  new: "חדש",
  contacted: "יצרנו קשר",
  qualified: "רלוונטי",
  converted: "הפך ללקוח",
  lost: "לא רלוונטי",
};

export const LEAD_STATUS_TONE: Record<string, StatusTone> = {
  new: "blue", contacted: "purple", qualified: "cyan", converted: "emerald", lost: "red",
};

export const LEAD_STATUS_OPTIONS = (["new", "contacted", "qualified", "converted", "lost"] as const).map(
  (v) => ({ value: v, label: LEAD_STATUS_LABEL[v] }),
);

export const TASK_STATUS_LABEL: Record<string, string> = {
  todo: "לביצוע", in_progress: "בתהליך", done: "הושלם",
};
export const TASK_STATUS_TONE: Record<string, StatusTone> = {
  todo: "slate", in_progress: "amber", done: "emerald",
};
