import { useEffect, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

let openRef: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

export function confirmDialog(opts: ConfirmOptions = {}): Promise<boolean> {
  if (!openRef) {
    if (typeof window === "undefined") return Promise.resolve(false);
    return Promise.resolve(window.confirm(opts.description ?? opts.title ?? "בטוח?"));
  }
  return openRef(opts);
}

export function ConfirmDialogHost() {
  const [pending, setPending] = useState<{ opts: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  useEffect(() => {
    openRef = (opts) => new Promise<boolean>((resolve) => setPending({ opts, resolve }));
    return () => { openRef = null; };
  }, []);

  function done(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  return (
    <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o) done(false); }}>
      <AlertDialogContent className="glass-strong" dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.opts.title ?? "אישור פעולה"}</AlertDialogTitle>
          {pending?.opts.description && (
            <AlertDialogDescription>{pending.opts.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => done(false)}>
            {pending?.opts.cancelText ?? "ביטול"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => done(true)}
            className={pending?.opts.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {pending?.opts.confirmText ?? "אישור"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
