import { supabase } from "@/integrations/supabase/client";

export type ActivityEntityType = "lead" | "customer" | "project" | "quote" | "task" | "meeting";

export interface LogActivityInput {
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

const tableToEntity: Record<string, ActivityEntityType> = {
  leads: "lead",
  customers: "customer",
  projects: "project",
  quotes: "quote",
  tasks: "task",
  meetings: "meeting",
};

export function entityTypeFromTable(table: string): ActivityEntityType | null {
  return tableToEntity[table] ?? null;
}

export async function logActivity(input: LogActivityInput) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("activities").insert({
      user_id: user.id,
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    console.warn("logActivity failed", err);
  }
}

/** Detects field changes between previous & current and returns human-readable summary lines. */
export function diffFields(prev: Record<string, any> | null | undefined, next: Record<string, any>) {
  if (!prev) return [];
  const changes: { field: string; from: any; to: any }[] = [];
  const skip = new Set(["updated_at", "created_at", "user_id", "id"]);
  for (const k of Object.keys(next)) {
    if (skip.has(k)) continue;
    const a = prev[k];
    const b = next[k];
    const eq = JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
    if (!eq) changes.push({ field: k, from: a, to: b });
  }
  return changes;
}
