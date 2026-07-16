
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS next_follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_note text;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS next_follow_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS follow_up_note text;

CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up_at ON public.leads(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_next_follow_up_at ON public.customers(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
