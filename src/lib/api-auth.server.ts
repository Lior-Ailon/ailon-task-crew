import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

export const ALLOWED_TABLES = [
  'leads',
  'customers',
  'projects',
  'tasks',
  'meetings',
  'ideas',
  'quotes',
  'subscriptions',
  'shelf_products',
  'incomes',
  'expenses',
] as const

export type AllowedTable = (typeof ALLOWED_TABLES)[number]

export function isAllowedTable(t: string): t is AllowedTable {
  return (ALLOWED_TABLES as readonly string[]).includes(t)
}

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function getAdminClient(): SupabaseClient | Response {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return Response.json({ error: 'server_misconfigured' }, { status: 500 })
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export interface ApiKeyRecord {
  id: string
  name: string
  allowed_tables: string[] | null
  can_write: boolean
  revoked_at: string | null
}

export interface ApiAuthContext {
  admin: SupabaseClient
  apiKey: ApiKeyRecord
}

export async function authenticateApiRequest(
  request: Request,
  table: string,
  method: string,
): Promise<ApiAuthContext | Response> {
  if (!isAllowedTable(table)) {
    return Response.json({ error: 'unknown_table' }, { status: 404 })
  }
  const auth = request.headers.get('authorization') ?? ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) {
    return Response.json({ error: 'missing_api_key' }, { status: 401 })
  }
  const key = m[1].trim()
  const admin = getAdminClient()
  if (admin instanceof Response) return admin

  const { data, error } = await admin
    .from('api_keys')
    .select('id, name, allowed_tables, can_write, revoked_at')
    .eq('key_hash', hashKey(key))
    .maybeSingle()

  if (error || !data || data.revoked_at) {
    return Response.json({ error: 'invalid_api_key' }, { status: 401 })
  }
  if (data.allowed_tables && !data.allowed_tables.includes(table)) {
    return Response.json({ error: 'table_not_allowed' }, { status: 403 })
  }
  const isWrite = method !== 'GET' && method !== 'HEAD'
  if (isWrite && !data.can_write) {
    return Response.json({ error: 'read_only_key' }, { status: 403 })
  }
  // fire and forget
  admin
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return { admin, apiKey: data as ApiKeyRecord }
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

function pickTitle(row: any): string {
  return String(row?.title ?? row?.name ?? row?.full_name ?? row?.company ?? row?.id ?? '')
}

export async function notifyApiChange(params: {
  table: string
  action: string
  row: any
  actor?: string
}) {
  try {
    const origin = process.env.PUBLIC_APP_URL || 'https://ailon-task-crew.lovable.app'
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return
    await fetch(`${origin}/lovable/email/transactional/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
        'Lovable-Context': 'api',
      },
      body: JSON.stringify({
        templateName: 'entity-update',
        recipientEmail: 'Ailon-Team@ailon-task.com',
        idempotencyKey: `api-${params.table}-${params.row?.id ?? 'x'}-${params.action}-${Date.now()}`,
        templateData: {
          entityLabel: labelForTable(params.table),
          action: params.action,
          title: pickTitle(params.row),
          fields: [],
          actor: params.actor ?? 'API',
        },
      }),
    })
  } catch (err) {
    console.warn('api notifyChange failed', err)
  }
}
