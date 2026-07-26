// Shared status label + color mapping. Keep DB values in English; render Hebrew.
// Tones are semantic, harmonized with the brand teal/cyan palette.
// Legacy tone names remain in the union for backward-compat with existing callers.
export type StatusTone =
  | "default"
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "neutral"
  // legacy aliases — mapped to semantic tones below
  | "blue"
  | "purple"
  | "cyan"
  | "emerald"
  | "red"
  | "amber"
  | "slate";

export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  default: "tone-default",
  success: "tone-success",
  warning: "tone-warning",
  info: "tone-info",
  danger: "tone-danger",
  neutral: "tone-neutral",
  // legacy aliases
  blue: "tone-info",
  purple: "tone-info",
  cyan: "tone-info",
  emerald: "tone-success",
  red: "tone-danger",
  amber: "tone-warning",
  slate: "tone-neutral",
};

export const SOFT_OVERDUE = "tone-danger";
export const SOFT_UPCOMING = "tone-warning";

export const LEAD_STATUS_LABEL: Record<string, string> = {
  new: "חדש",
  contacted: "יצרנו קשר",
  qualified: "רלוונטי",
  converted: "הפך ללקוח",
  lost: "לא רלוונטי",
};

export const LEAD_STATUS_TONE: Record<string, StatusTone> = {
  new: "info",
  contacted: "info",
  qualified: "info",
  converted: "success",
  lost: "danger",
};

export const LEAD_STATUS_OPTIONS = (["new", "contacted", "qualified", "converted", "lost"] as const).map(
  (v) => ({ value: v, label: LEAD_STATUS_LABEL[v] }),
);

export const TASK_STATUS_LABEL: Record<string, string> = {
  todo: "לביצוע", in_progress: "בתהליך", done: "הושלם",
};
export const TASK_STATUS_TONE: Record<string, StatusTone> = {
  todo: "neutral", in_progress: "warning", done: "success",
};
