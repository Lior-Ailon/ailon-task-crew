DROP POLICY IF EXISTS "own leads all" ON public.leads;
DROP POLICY IF EXISTS "anyone authenticated can view leads" ON public.leads;
DROP POLICY IF EXISTS "anyone authenticated can update leads" ON public.leads;
DROP POLICY IF EXISTS "anyone authenticated can delete leads" ON public.leads;
DROP POLICY IF EXISTS "users insert own leads" ON public.leads;
CREATE POLICY "anyone authenticated can view leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "users insert own leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anyone authenticated can update leads" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anyone authenticated can delete leads" ON public.leads FOR DELETE TO authenticated USING (true);