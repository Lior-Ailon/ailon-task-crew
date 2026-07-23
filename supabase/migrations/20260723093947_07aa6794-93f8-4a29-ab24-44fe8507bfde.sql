
-- Helper: drop and recreate open policies for team-shared tables
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'leads','customers','projects','tasks','meetings','ideas',
    'quotes','subscriptions','shelf_products','incomes','expenses','activities'
  ];
  pol record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Drop all existing policies on the table
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    -- Create one open policy for authenticated users
    EXECUTE format(
      'CREATE POLICY "authenticated full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- meeting_participants: open to any authenticated user (meetings are shared)
DROP POLICY IF EXISTS "Meeting owners can delete participants" ON public.meeting_participants;
DROP POLICY IF EXISTS "Meeting owners can insert participants" ON public.meeting_participants;
DROP POLICY IF EXISTS "Meeting owners can update participants" ON public.meeting_participants;
DROP POLICY IF EXISTS "Meeting owners can view participants" ON public.meeting_participants;
CREATE POLICY "authenticated full access" ON public.meeting_participants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- profiles: any authenticated user can view; own-only for insert/update
DROP POLICY IF EXISTS "team members view profiles" ON public.profiles;
CREATE POLICY "authenticated view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
-- (own profile insert / own profile update policies preserved)
