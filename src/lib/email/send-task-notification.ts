import { supabase } from '@/integrations/supabase/client'

export interface SendTaskEmailInput {
  eventLabel: string
  taskTitle: string
  taskId: string
  taskDescription?: string
  status?: string
  priority?: string
  dueDate?: string
  assignee?: string
  actor?: string
}

export async function sendTaskNotification(input: SendTaskEmailInput) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const idempotencyKey = `task-${input.taskId}-${input.eventLabel}-${Date.now()}`
    await fetch('/lovable/email/transactional/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        templateName: 'task-notification',
        recipientEmail: 'Ailon-Team@ailon-task.com',
        idempotencyKey,
        templateData: {
          eventLabel: input.eventLabel,
          taskTitle: input.taskTitle,
          taskDescription: input.taskDescription,
          status: input.status,
          priority: input.priority,
          dueDate: input.dueDate,
          assignee: input.assignee,
          actor: input.actor,
        },
      }),
    })
  } catch (err) {
    console.warn('task notification email failed', err)
  }
}
