DROP POLICY IF EXISTS "own tasks all" ON public.tasks;
CREATE POLICY "anyone authenticated can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "users insert own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);