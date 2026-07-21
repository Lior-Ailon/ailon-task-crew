import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LOST_REASONS } from "@/lib/lead-utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadName?: string;
  onConfirm: (reason: string, note: string) => void | Promise<void>;
  onCancel?: () => void;
}

export function LostReasonDialog({ open, onOpenChange, leadName, onConfirm, onCancel }: Props) {
  const [reason, setReason] = useState<string>(LOST_REASONS[0].value);
  const [note, setNote] = useState("");
  useEffect(() => { if (open) { setReason(LOST_REASONS[0].value); setNote(""); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel?.(); onOpenChange(o); }}>
      <DialogContent className="glass-strong">
        <DialogHeader>
          <DialogTitle>סימון ליד כלא רלוונטי{leadName ? ` — ${leadName}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>סיבה *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOST_REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>הערה (אופציונלי)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="פרט את הסיבה..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onCancel?.(); onOpenChange(false); }}>ביטול</Button>
          <Button onClick={() => onConfirm(reason, note)}>שמור סיבה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
