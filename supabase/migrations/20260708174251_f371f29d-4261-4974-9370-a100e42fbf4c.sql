
-- expenses
DROP POLICY IF EXISTS "auth all select expenses" ON public.expenses;
DROP POLICY IF EXISTS "auth all update expenses" ON public.expenses;
DROP POLICY IF EXISTS "auth all delete expenses" ON public.expenses;
CREATE POLICY "own expenses select" ON public.expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own expenses update" ON public.expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own expenses delete" ON public.expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- incomes
DROP POLICY IF EXISTS "auth all select incomes" ON public.incomes;
DROP POLICY IF EXISTS "auth all update incomes" ON public.incomes;
DROP POLICY IF EXISTS "auth all delete incomes" ON public.incomes;
CREATE POLICY "own incomes select" ON public.incomes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own incomes update" ON public.incomes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own incomes delete" ON public.incomes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- leads
DROP POLICY IF EXISTS "anyone authenticated can view leads" ON public.leads;
DROP POLICY IF EXISTS "anyone authenticated can update leads" ON public.leads;
DROP POLICY IF EXISTS "anyone authenticated can delete leads" ON public.leads;
CREATE POLICY "own leads select" ON public.leads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own leads update" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own leads delete" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- tasks
DROP POLICY IF EXISTS "anyone authenticated can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "anyone authenticated can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "anyone authenticated can delete tasks" ON public.tasks;
CREATE POLICY "own tasks select" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own tasks update" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tasks delete" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- quotes
DROP POLICY IF EXISTS "Authenticated can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated can delete quotes" ON public.quotes;
CREATE POLICY "own quotes select" ON public.quotes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own quotes update" ON public.quotes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own quotes delete" ON public.quotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- subscriptions
DROP POLICY IF EXISTS "Authenticated can view subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated can update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated can delete subscriptions" ON public.subscriptions;
CREATE POLICY "own subscriptions select" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own subscriptions update" ON public.subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own subscriptions delete" ON public.subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- profiles: remove broad "view all" policy
DROP POLICY IF EXISTS "Authenticated can view all profiles" ON public.profiles;

-- receipts storage bucket: enforce per-user folder ownership (user_id/filename)
DROP POLICY IF EXISTS "auth read receipts" ON storage.objects;
DROP POLICY IF EXISTS "auth upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "auth update receipts" ON storage.objects;
DROP POLICY IF EXISTS "auth delete receipts" ON storage.objects;
CREATE POLICY "own receipts read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own receipts upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own receipts update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own receipts delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Revoke public execute on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
