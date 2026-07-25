import { createFileRoute } from '@tanstack/react-router'
import { authenticateApiRequest, notifyApiChange } from '@/lib/api-auth.server'

export const Route = createFileRoute('/api/v1/$table/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const ctx = await authenticateApiRequest(request, params.table, 'GET')
        if (ctx instanceof Response) return ctx
        const { data, error } = await ctx.admin
          .from(params.table)
          .select('*')
          .eq('id', params.id)
          .maybeSingle()
        if (error) return Response.json({ error: error.message }, { status: 400 })
        if (!data) return Response.json({ error: 'not_found' }, { status: 404 })
        return Response.json({ data })
      },
      PATCH: async ({ request, params }) => {
        const ctx = await authenticateApiRequest(request, params.table, 'PATCH')
        if (ctx instanceof Response) return ctx
        let body: any
        try { body = await request.json() } catch {
          return Response.json({ error: 'invalid_body' }, { status: 400 })
        }
        const { data, error } = await ctx.admin
          .from(params.table)
          .update(body)
          .eq('id', params.id)
          .select()
          .maybeSingle()
        if (error) return Response.json({ error: error.message }, { status: 400 })
        if (!data) return Response.json({ error: 'not_found' }, { status: 404 })
        notifyApiChange({ table: params.table, action: 'עודכן', row: data, actor: `API (${ctx.apiKey.name})` })
        return Response.json({ data })
      },
      DELETE: async ({ request, params }) => {
        const ctx = await authenticateApiRequest(request, params.table, 'DELETE')
        if (ctx instanceof Response) return ctx
        const { data, error } = await ctx.admin
          .from(params.table)
          .delete()
          .eq('id', params.id)
          .select()
          .maybeSingle()
        if (error) return Response.json({ error: error.message }, { status: 400 })
        if (!data) return Response.json({ error: 'not_found' }, { status: 404 })
        notifyApiChange({ table: params.table, action: 'נמחק', row: data, actor: `API (${ctx.apiKey.name})` })
        return Response.json({ data })
      },
    },
  },
})
