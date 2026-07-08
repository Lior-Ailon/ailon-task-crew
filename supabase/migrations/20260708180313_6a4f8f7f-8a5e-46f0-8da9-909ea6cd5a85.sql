
-- Shared team access: any authenticated user can read/write all rows
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['leads','tasks','projects','expenses','incomes','quotes','subscriptions'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- drop existing policies
    EXECUTE format('DO $inner$ DECLARE p record; BEGIN FOR p IN SELECT policyname FROM pg_policies WHERE schemaname=''public'' AND tablename=%L LOOP EXECUTE format(''DROP POLICY IF EXISTS %%I ON public.%%I'', p.policyname, %L); END LOOP; END $inner$;', t, t);
    -- create shared policies
    EXECUTE format('CREATE POLICY "team select" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "team insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "team update" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "team delete" ON public.%I FOR DELETE TO authenticated USING (true)', t);
  END LOOP;
END $$;
