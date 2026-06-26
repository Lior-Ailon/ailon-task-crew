DROP POLICY IF EXISTS "users update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "users delete own tasks" ON public.tasks;
CREATE POLICY "anyone authenticated can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anyone authenticated can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (true);