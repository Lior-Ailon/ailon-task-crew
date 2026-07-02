
-- Expenses
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  expense_type text NOT NULL,
  spender text,
  amount numeric,
  notes text,
  receipt_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all select expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth all insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth all update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all delete expenses" ON public.expenses FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_expenses_updated BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Incomes
CREATE TABLE public.incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  income_date date NOT NULL DEFAULT CURRENT_DATE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text,
  amount numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incomes TO authenticated;
GRANT ALL ON public.incomes TO service_role;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all select incomes" ON public.incomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth all insert incomes" ON public.incomes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "auth all update incomes" ON public.incomes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth all delete incomes" ON public.incomes FOR DELETE TO authenticated USING (true);
CREATE TRIGGER trg_incomes_updated BEFORE UPDATE ON public.incomes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for receipts bucket (private) — allow authenticated users full access
CREATE POLICY "auth read receipts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'receipts');
CREATE POLICY "auth upload receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "auth update receipts" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'receipts');
CREATE POLICY "auth delete receipts" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'receipts');
