import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { toast } from 'sonner'
import { listApiKeys, createApiKey, revokeApiKey } from '@/lib/api-keys.functions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { confirmDialog } from '@/components/confirm-dialog'
import { Copy, KeyRound, Trash2, Plus } from 'lucide-react'

const TABLES = [
  'leads', 'customers', 'projects', 'tasks', 'meetings', 'ideas',
  'quotes', 'subscriptions', 'shelf_products', 'incomes', 'expenses',
]

export function ApiKeysManager() {
  const qc = useQueryClient()
  const listFn = useServerFn(listApiKeys)
  const createFn = useServerFn(createApiKey)
  const revokeFn = useServerFn(revokeApiKey)

  const { data: keys, isLoading, error } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => listFn({}),
  })

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [canWrite, setCanWrite] = useState(true)
  const [allowedTables, setAllowedTables] = useState<string[]>([])
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  const createMut = useMutation({
    mutationFn: (input: any) => createFn({ data: input }),
    onSuccess: (res: any) => {
      setCreatedKey(res.key)
      qc.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const revokeMut = useMutation({
    mutationFn: (id: string) => revokeFn({ data: { id } }),
    onSuccess: () => {
      toast.success('המפתח בוטל')
      qc.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const resetForm = () => {
    setName(''); setCanWrite(true); setAllowedTables([]); setCreatedKey(null)
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card/60 backdrop-blur p-4 space-y-2 text-sm">
        <div className="font-semibold flex items-center gap-2"><KeyRound className="size-4" /> API חיצוני</div>
        <div className="text-muted-foreground space-y-1">
          <div>Base URL: <code className="bg-muted px-1 rounded">{baseUrl}/api/v1/{'{table}'}</code></div>
          <div>Header: <code className="bg-muted px-1 rounded">Authorization: Bearer &lt;key&gt;</code></div>
          <div>לכידת לידים ציבורית: <code className="bg-muted px-1 rounded">POST {baseUrl}/api/public/leads</code></div>
          <pre className="text-xs bg-muted/60 rounded p-2 overflow-x-auto mt-2 text-left" dir="ltr">
{`# List leads
curl -H "Authorization: Bearer YOUR_KEY" ${baseUrl}/api/v1/leads?limit=20

# Public web-to-lead
curl -X POST ${baseUrl}/api/public/leads \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John","email":"j@x.com","source":"landing"}'`}
          </pre>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">מפתחות API</h3>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="size-4 ml-1" /> מפתח חדש</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>יצירת מפתח API</DialogTitle></DialogHeader>
            {createdKey ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive font-medium">שמור את המפתח עכשיו — לא נציג אותו שוב!</p>
                <div className="flex gap-2">
                  <Input readOnly value={createdKey} dir="ltr" className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(createdKey); toast.success('הועתק') }}>
                    <Copy className="size-4" />
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setOpen(false); resetForm() }}>סיום</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label>שם</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם המפתח" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="cw" checked={canWrite} onCheckedChange={(v) => setCanWrite(!!v)} />
                  <Label htmlFor="cw">הרשאות כתיבה (יצירה/עדכון/מחיקה)</Label>
                </div>
                <div>
                  <Label>טבלאות מותרות (ריק = הכל)</Label>
                  <div className="grid grid-cols-2 gap-1 mt-2 max-h-48 overflow-y-auto">
                    {TABLES.map((t) => (
                      <label key={t} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={allowedTables.includes(t)}
                          onCheckedChange={(v) => {
                            setAllowedTables((prev) => v ? [...prev, t] : prev.filter(x => x !== t))
                          }}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    disabled={createMut.isPending || !name.trim()}
                    onClick={() => createMut.mutate({ name, can_write: canWrite, allowed_tables: allowedTables })}
                  >
                    צור מפתח
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">טוען...</div>}
      {error && <div className="text-sm text-destructive">{(error as any).message}</div>}

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-right">
              <th className="p-2">שם</th>
              <th className="p-2">קידומת</th>
              <th className="p-2">טבלאות</th>
              <th className="p-2">כתיבה</th>
              <th className="p-2">נוצר</th>
              <th className="p-2">שימוש אחרון</th>
              <th className="p-2">סטטוס</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {keys?.map((k: any) => (
              <tr key={k.id} className="border-t">
                <td className="p-2 font-medium">{k.name}</td>
                <td className="p-2 font-mono text-xs">{k.key_prefix}…</td>
                <td className="p-2 text-xs">{k.allowed_tables?.join(', ') ?? 'הכל'}</td>
                <td className="p-2">{k.can_write ? 'כן' : 'לא'}</td>
                <td className="p-2 text-xs">{new Date(k.created_at).toLocaleDateString('he-IL')}</td>
                <td className="p-2 text-xs">{k.last_used_at ? new Date(k.last_used_at).toLocaleString('he-IL') : '—'}</td>
                <td className="p-2 text-xs">{k.revoked_at ? <span className="text-destructive">בוטל</span> : <span className="text-emerald-600">פעיל</span>}</td>
                <td className="p-2">
                  {!k.revoked_at && (
                    <Button
                      size="sm" variant="ghost"
                      onClick={async () => {
                        const ok = await confirmDialog({ title: 'לבטל מפתח?', description: 'המפתח יפסיק לעבוד מיידית.' })
                        if (ok) revokeMut.mutate(k.id)
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {keys?.length === 0 && (
              <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">אין מפתחות</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
