import { supabase } from '@/integrations/supabase/client'

export interface InviteMeetingParticipantsInput {
  meetingId: string
  meetingTitle: string
  meetingDescription?: string | null
  startTime: string
  location?: string | null
  meetingUrl?: string | null
  hostName?: string | null
  entries: string[] // participants list — emails will be invited
}

function looksLikeEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString('he-IL', { dateStyle: 'long', timeStyle: 'short' })
  } catch {
    return iso
  }
}

/**
 * For each participant entry that is an email, insert a meeting_participants row
 * (with unique token) and send an invitation email.
 */
export async function inviteMeetingParticipants(input: InviteMeetingParticipantsInput) {
  const emails = Array.from(
    new Set(
      input.entries.map((s) => s.trim()).filter(looksLikeEmail).map((s) => s.toLowerCase()),
    ),
  )
  if (emails.length === 0) return

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  // Insert participants and get tokens back
  const rows = emails.map((email) => ({ meeting_id: input.meetingId, email }))
  const { data: inserted, error } = await supabase
    .from('meeting_participants')
    .insert(rows)
    .select('email, token')

  if (error || !inserted) {
    console.warn('meeting participants insert failed', error)
    return
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const meetingWhen = formatWhen(input.startTime)

  await Promise.all(
    inserted.map(async (p: { email: string; token: string }) => {
      const acceptUrl = `${origin}/meeting-invite?token=${p.token}&action=accept`
      const declineUrl = `${origin}/meeting-invite?token=${p.token}&action=decline`
      try {
        await fetch('/lovable/email/transactional/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            templateName: 'meeting-invitation',
            recipientEmail: p.email,
            idempotencyKey: `meeting-invite-${input.meetingId}-${p.token}`,
            templateData: {
              meetingTitle: input.meetingTitle,
              meetingDescription: input.meetingDescription ?? undefined,
              meetingWhen,
              meetingLocation: input.location ?? undefined,
              meetingUrl: input.meetingUrl ?? undefined,
              hostName: input.hostName ?? undefined,
              acceptUrl,
              declineUrl,
            },
          }),
        })
      } catch (err) {
        console.warn('meeting invitation email failed', err)
      }
    }),
  )
}
