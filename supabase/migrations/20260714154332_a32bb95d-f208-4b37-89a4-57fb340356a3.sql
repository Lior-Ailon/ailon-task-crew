CREATE TABLE public.shelf_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  price NUMERIC,
  cost NUMERIC,
  stock INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shelf_products TO authenticated;
GRANT ALL ON public.shelf_products TO service_role;
ALTER TABLE public.shelf_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own shelf_products select" ON public.shelf_products FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own shelf_products insert" ON public.shelf_products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own shelf_products update" ON public.shelf_products FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own shelf_products delete" ON public.shelf_products FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_shelf_products_updated_at BEFORE UPDATE ON public.shelf_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();