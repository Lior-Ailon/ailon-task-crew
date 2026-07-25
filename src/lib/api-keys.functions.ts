import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { randomBytes, createHash } from 'crypto'

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('אין לך הרשאת מנהל לפעולה זו')
}

export const listApiKeys = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { data, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, name, key_prefix, allowed_tables, can_write, created_at, last_used_at, revoked_at')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  })

export const createApiKey = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { name: string; allowed_tables?: string[] | null; can_write?: boolean }) => {
    if (!data?.name?.trim()) throw new Error('חסר שם למפתח')
    return {
      name: data.name.trim(),
      allowed_tables: data.allowed_tables && data.allowed_tables.length ? data.allowed_tables : null,
      can_write: data.can_write ?? true,
    }
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const raw = randomBytes(24).toString('base64url')
    const key = `atk_${raw}`
    const key_hash = createHash('sha256').update(key).digest('hex')
    const key_prefix = key.slice(0, 10)
    const { data: row, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        name: data.name,
        allowed_tables: data.allowed_tables,
        can_write: data.can_write,
        key_hash,
        key_prefix,
        created_by: context.userId,
      })
      .select('id, name, key_prefix, created_at')
      .maybeSingle()
    if (error) throw new Error(error.message)
    return { ...row, key }
  })

export const revokeApiKey = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => {
    if (!d?.id) throw new Error('חסר מזהה')
    return d
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId)
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const { error } = await supabaseAdmin
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
    return { ok: true }
  })
