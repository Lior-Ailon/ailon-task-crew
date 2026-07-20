import { Mail, Phone, MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/lead-utils";
import { cn } from "@/lib/utils";

interface Props {
  email?: string | null;
  phone?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/** Clickable contact chips — tel:/mailto:/wa.me. Stops propagation so it doesn't trigger the parent card click. */
export function QuickContactActions({ email, phone, size = "sm", className }: Props) {
  const wa = whatsappUrl(phone);
  const iconCls = size === "sm" ? "size-3" : "size-4";
  const chipCls = "inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/40 hover:bg-muted border border-border/40 text-[11px] transition-colors";
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)} onClick={stop}>
      {email && (
        <a href={`mailto:${email}`} className={chipCls} dir="ltr" onClick={stop}>
          <Mail className={iconCls} /> {email}
        </a>
      )}
      {phone && (
        <a href={`tel:${phone}`} className={chipCls} dir="ltr" onClick={stop}>
          <Phone className={iconCls} /> {phone}
        </a>
      )}
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(chipCls, "text-emerald-700 border-emerald-300/50 hover:bg-emerald-500/10")}
          onClick={stop}
        >
          <MessageCircle className={iconCls} /> WhatsApp
        </a>
      )}
    </div>
  );
}
