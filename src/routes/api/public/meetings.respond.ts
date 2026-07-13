import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

export const Route = createFileRoute('/api/public/meetings/respond')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let token: string | undefined
        let action: string | undefined
        try {
          const body = await request.json()
          token = String(body.token ?? '')
          action = String(body.action ?? '')
        } catch {
          return Response.json({ error: 'invalid_body' }, { status: 400 })
        }

        if (!token || !/^[a-f0-9]{20,}$/i.test(token)) {
          return Response.json({ error: 'invalid_token' }, { status: 400 })
        }
        if (action !== 'accept' && action !== 'decline' && action !== 'view') {
          return Response.json({ error: 'invalid_action' }, { status: 400 })
        }

        const supabaseUrl = process.env.SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !serviceKey) {
          return Response.json({ error: 'server_misconfigured' }, { status: 500 })
        }

        const admin = createClient(supabaseUrl, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })

        const { data: participant, error: pErr } = await admin
          .from('meeting_participants')
          .select('id, meeting_id, email, name, status')
          .eq('token', token)
          .maybeSingle()

        if (pErr || !participant) {
          return Response.json({ error: 'not_found' }, { status: 404 })
        }

        if (action === 'accept' || action === 'decline') {
          const newStatus = action === 'accept' ? 'accepted' : 'declined'
          const { error: uErr } = await admin
            .from('meeting_participants')
            .update({ status: newStatus, responded_at: new Date().toISOString() })
            .eq('id', participant.id)
          if (uErr) {
            return Response.json({ error: 'update_failed' }, { status: 500 })
          }
          participant.status = newStatus
        }

        const { data: meeting } = await admin
          .from('meetings')
          .select('title, description, start_time, location, meeting_url, status')
          .eq('id', participant.meeting_id)
          .maybeSingle()

        return Response.json({
          ok: true,
          participant: {
            email: participant.email,
            name: participant.name,
            status: participant.status,
          },
          meeting,
        })
      },
    },
  },
})
