import { supabase } from '@/integrations/supabase/client'

export interface EntityNotificationInput {
  entityLabel: string
  action: string
  title: string
  entityId: string
  fields?: { label: string; value: string }[]
  actor?: string
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
}

export function labelForTable(table: string) {
  return TABLE_LABELS[table] ?? table
}

export async function sendEntityNotification(input: EntityNotificationInput) {
  try {
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
  } catch (err) {
    console.warn('entity notification email failed', err)
  }
}
