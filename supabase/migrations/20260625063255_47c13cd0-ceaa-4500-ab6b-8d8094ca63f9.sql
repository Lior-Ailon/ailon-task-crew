CREATE TYPE public.idea_status AS ENUM ('new','in_review','approved','rejected','implemented');
CREATE TYPE public.idea_priority AS ENUM ('low','medium','high');

CREATE TABLE public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  status public.idea_status NOT NULL DEFAULT 'new',
  priority public.idea_priority NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideas TO authenticated;
GRANT ALL ON public.ideas TO service_role;

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ideas all" ON public.ideas FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();