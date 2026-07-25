import { createFileRoute } from '@tanstack/react-router'
import { getAdminClient, notifyApiChange } from '@/lib/api-auth.server'

export const Route = createFileRoute('/api/public/leads')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any
        try { body = await request.json() } catch {
          return Response.json({ error: 'invalid_body' }, { status: 400 })
        }
        // Honeypot
        if (body?.website) {
          return Response.json({ ok: true }, { status: 200 })
        }
        const name = String(body?.name ?? '').trim()
        const email = body?.email ? String(body.email).trim() : null
        const phone = body?.phone ? String(body.phone).trim() : null
        if (!name) return Response.json({ error: 'name_required' }, { status: 400 })
        if (!email && !phone) return Response.json({ error: 'email_or_phone_required' }, { status: 400 })

        const admin = getAdminClient()
        if (admin instanceof Response) return admin

        // Pick first admin as owner
        const { data: adminRole } = await admin
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin')
          .limit(1)
          .maybeSingle()

        const insert: any = {
          name,
          email,
          phone,
          company: body?.company ?? null,
          source: body?.source ?? 'Web Form',
          notes: body?.notes ?? null,
          status: 'new',
          user_id: adminRole?.user_id ?? null,
        }

        const { data, error } = await admin
          .from('leads')
          .insert(insert)
          .select('id')
          .maybeSingle()

        if (error) return Response.json({ error: error.message }, { status: 400 })

        notifyApiChange({ table: 'leads', action: 'נוצר (טופס אתר)', row: { ...insert, id: data?.id }, actor: 'Web Form' })

        return Response.json({ ok: true, id: data?.id }, { status: 201 })
      },
    },
  },
})
