import { supabase } from '@/integrations/supabase/client'

export interface EntityNotificationInput {
  entityLabel: string
  action: string
  title: string
  entityId: string
  fields?: { label: string; value: string }[]
  actor?: string
  /** Force an immediate email instead of the daily digest. */
  immediate?: boolean
}

const TABLE_LABELS: Record<string, string> = {
  leads: 'ליד',
  customers: 'לקוח',
  projects: 'פרויקט',
  tasks: 'משימה',
  meetings: 'פגישה',
  ideas: 'רעיון',
  subscriptions: 'מנוי',
  quotes: 'הצעת מחיר',
  expenses: 'הוצאה',
  incomes: 'הכנסה',
  shelf_products: 'מוצר מדף',
}

export function labelForTable(table: string) {
  return TABLE_LABELS[table] ?? table
}

/** Immediate email only for: new lead, quote accepted, overdue follow-up. */
export function isImmediateEvent(input: EntityNotificationInput) {
  if (input.immediate) return true
  if (input.entityLabel === 'ליד' && input.action === 'נוצר') return true
  if (input.entityLabel === 'הצעת מחיר') {
    const status = (input.fields ?? []).find((f) => f.label === 'סטטוס' || f.label === 'status')
    if (status && /accepted|אושר/i.test(status.value)) return true
  }
  return false
}

async function fetchNotificationSettings() {
  const { data } = await supabase
    .from('app_settings')
    .select('digest_enabled, immediate_notifications_enabled')
    .eq('id', 'global')
    .maybeSingle()
  return {
    digestEnabled: (data as any)?.digest_enabled ?? true,
    immediateEnabled: (data as any)?.immediate_notifications_enabled ?? true,
  }
}

async function sendNow(input: EntityNotificationInput) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const idempotencyKey = `entity-${input.entityId}-${input.action}-${Date.now()}`
  await fetch('/lovable/email/transactional/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      templateName: 'entity-update',
      recipientEmail: 'Ailon-Team@ailon-task.com',
      idempotencyKey,
      templateData: {
        entityLabel: input.entityLabel,
        action: input.action,
        title: input.title,
        fields: input.fields ?? [],
        actor: input.actor,
      },
    }),
  })
}

async function queueForDigest(input: EntityNotificationInput) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('notification_events').insert({
    user_id: user?.id ?? null,
    entity_label: input.entityLabel,
    action: input.action,
    title: input.title,
    entity_id: input.entityId,
    fields: (input.fields ?? []) as any,
    actor: input.actor ?? user?.email ?? null,
  } as any)
}

export async function sendEntityNotification(input: EntityNotificationInput) {
  try {
    const { digestEnabled, immediateEnabled } = await fetchNotificationSettings()
    if (isImmediateEvent(input)) {
      if (immediateEnabled) await sendNow(input)
      return
    }
    if (digestEnabled) await queueForDigest(input)
  } catch (err) {
    console.warn('entity notification failed', err)
  }
}
