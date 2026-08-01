ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status_changed_at timestamptz;
UPDATE public.leads SET status_changed_at = COALESCE(status_changed_at, created_at);
ALTER TABLE public.leads ALTER COLUMN status_changed_at SET DEFAULT now();
ALTER TABLE public.leads ALTER COLUMN status_changed_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.track_lead_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_lead_status_change ON public.leads;
CREATE TRIGGER trg_track_lead_status_change
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.track_lead_status_change();

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS digest_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS immediate_notifications_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  entity_label text NOT NULL,
  action text NOT NULL,
  title text NOT NULL,
  entity_id text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  actor text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.notification_events TO authenticated;
GRANT ALL ON public.notification_events TO service_role;

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can insert notification events"
ON public.notification_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can read notification events"
ON public.notification_events FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_notification_events_pending
ON public.notification_events (created_at) WHERE sent_at IS NULL;