import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Calendar, MapPin, Link2, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import logoAsset from '@/assets/ailon-logo.png.asset.json'

type Meeting = {
  title: string
  description?: string | null
  start_time: string
  location?: string | null
  meeting_url?: string | null
  status?: string | null
}
type Participant = { email: string; name?: string | null; status: string }

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('he-IL', { dateStyle: 'long', timeStyle: 'short' })
}

function MeetingInvitePage() {
  const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const token = search.get('token') ?? ''
  const initialAction = search.get('action') ?? 'view'

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)

  async function respond(action: 'view' | 'accept' | 'decline') {
    if (!token) {
      setError('קישור לא תקין')
      setLoading(false)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/public/meetings/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(
          data?.error === 'not_found'
            ? 'ההזמנה לא נמצאה או שפג תוקפה'
            : 'לא ניתן היה לעדכן. נסו שוב.',
        )
      } else {
        setMeeting(data.meeting)
        setParticipant(data.participant)
      }
    } catch {
      setError('שגיאת רשת')
    } finally {
      setBusy(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    const first = initialAction === 'accept' || initialAction === 'decline' ? initialAction : 'view'
    respond(first as 'view' | 'accept' | 'decline')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur rounded-3xl shadow-xl border border-white p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={logoAsset.url} alt="AILON TASK" className="size-12 object-contain" />
          <div>
            <div className="font-bold text-lg tracking-wider text-teal-700">AILON TASK</div>
            <div className="text-[11px] text-muted-foreground">הזמנה לפגישה</div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="size-5 animate-spin" /> טוען...
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        ) : meeting ? (
          <>
            <h1 className="text-2xl font-bold text-slate-900">{meeting.title}</h1>
            {meeting.description && (
              <p className="text-sm text-muted-foreground mt-2">{meeting.description}</p>
            )}

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="size-4 text-teal-600" />
                {formatDate(meeting.start_time)}
              </div>
              {meeting.location && (
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="size-4 text-teal-600" />
                  {meeting.location}
                </div>
              )}
              {meeting.meeting_url && (
                <a
                  href={meeting.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-teal-700 hover:underline break-all"
                >
                  <Link2 className="size-4" />
                  {meeting.meeting_url}
                </a>
              )}
            </div>

            <div className="mt-6 border-t pt-6">
              {participant?.status === 'accepted' ? (
                <div className="text-center bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 font-semibold">
                  <Check className="size-5 inline ml-1" /> אישרת את השתתפותך
                </div>
              ) : participant?.status === 'declined' ? (
                <div className="text-center bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 font-semibold">
                  <X className="size-5 inline ml-1" /> סימנת שלא תוכל להגיע
                </div>
              ) : null}

              <p className="text-sm text-muted-foreground text-center mt-4 mb-3">
                {participant?.status === 'pending' ? 'האם תוכל להגיע?' : 'ניתן לשנות את תגובתך'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  disabled={busy}
                  onClick={() => respond('accept')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="size-4 ml-1" /> אאשר
                </Button>
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() => respond('decline')}
                >
                  <X className="size-4 ml-1" /> לא אוכל
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/meeting-invite')({
  head: () => ({
    meta: [
      { title: 'הזמנה לפגישה — Ailon Task' },
      { name: 'description', content: 'אישור או ביטול השתתפות בפגישה' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: MeetingInvitePage,
})
