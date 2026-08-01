import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

/**
 * Daily digest job — invoked by pg_cron at 07:00 Israel time.
 * Collects all queued notification events and sends ONE summary email.
 */
export const Route = createFileRoute('/api/public/hooks/email-digest')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const apiKey = request.headers.get('apikey')
        if (!apiKey) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createClient(supabaseUrl, serviceKey)

        const { data: settings } = await supabase
          .from('app_settings')
          .select('digest_enabled')
          .eq('id', 'global')
          .maybeSingle()
        if ((settings as any)?.digest_enabled === false) {
          return Response.json({ success: true, skipped: 'digest_disabled' })
        }

        const { data: events, error } = await supabase
          .from('notification_events')
          .select('*')
          .is('sent_at', null)
          .order('created_at', { ascending: true })
          .limit(500)

        if (error) {
          console.error('digest: failed to read events', error)
          return Response.json({ error: 'Failed to read events' }, { status: 500 })
        }
        if (!events || events.length === 0) {
          return Response.json({ success: true, skipped: 'no_events' })
        }

        const groupMap = new Map<string, any[]>()
        for (const e of events as any[]) {
          const list = groupMap.get(e.entity_label) ?? []
          list.push({
            action: e.action,
            title: e.title,
            actor: e.actor ?? undefined,
            time: new Date(e.created_at).toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Jerusalem',
            }),
          })
          groupMap.set(e.entity_label, list)
        }
        const groups = Array.from(groupMap.entries()).map(([entityLabel, items]) => ({
          entityLabel,
          items,
        }))

        const dateLabel = new Date().toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' })
        const origin = new URL(request.url).origin

        const res = await fetch(`${origin}/lovable/email/transactional/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            templateName: 'daily-digest',
            recipientEmail: 'Ailon-Team@ailon-task.com',
            idempotencyKey: `daily-digest-${new Date().toISOString().slice(0, 10)}`,
            templateData: { dateLabel, total: events.length, groups },
          }),
        })

        if (!res.ok) {
          console.error('digest: send failed', res.status, await res.text())
          return Response.json({ error: 'Failed to send digest' }, { status: 502 })
        }

        await supabase
          .from('notification_events')
          .update({ sent_at: new Date().toISOString() })
          .in('id', (events as any[]).map((e) => e.id))

        return Response.json({ success: true, count: events.length })
      },
    },
  },
})
