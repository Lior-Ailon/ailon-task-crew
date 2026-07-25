import { createFileRoute } from '@tanstack/react-router'
import { authenticateApiRequest, notifyApiChange } from '@/lib/api-auth.server'

export const Route = createFileRoute('/api/v1/$table')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const ctx = await authenticateApiRequest(request, params.table, 'GET')
        if (ctx instanceof Response) return ctx
        const url = new URL(request.url)
        const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 500)
        const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0)
        const { data, error, count } = await ctx.admin
          .from(params.table)
          .select('*', { count: 'exact' })
          .range(offset, offset + limit - 1)
        if (error) return Response.json({ error: error.message }, { status: 400 })
        return Response.json({ data, count, limit, offset })
      },
      POST: async ({ request, params }) => {
        const ctx = await authenticateApiRequest(request, params.table, 'POST')
        if (ctx instanceof Response) return ctx
        let body: any
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'invalid_body' }, { status: 400 })
        }
        const { data, error } = await ctx.admin
          .from(params.table)
          .insert(body)
          .select()
          .maybeSingle()
        if (error) return Response.json({ error: error.message }, { status: 400 })
        notifyApiChange({ table: params.table, action: 'נוצר', row: data, actor: `API (${ctx.apiKey.name})` })
        return Response.json({ data }, { status: 201 })
      },
    },
  },
})
