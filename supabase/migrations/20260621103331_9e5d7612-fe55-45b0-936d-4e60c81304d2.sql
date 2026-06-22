
-- 1) Drop the overly permissive public SELECT policy on profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 2) Replace with owner-only SELECT
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3) Create an email-free public view for community/leaderboard features
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, display_name, country, favorite_team_id, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 4) Allow anon/authenticated to read non-sensitive columns through the view.
--    The view uses security_invoker, so it respects the caller's RLS. Add a
--    policy that allows reading the safe columns publicly. We can't do
--    column-level RLS easily, so we add a permissive SELECT policy that only
--    applies when the query is via the view. Simplest: a second SELECT
--    policy that allows public read of all rows — but that re-exposes email.
--    Instead: keep SELECT restricted to owner on the base table, and expose
--    the view via a SECURITY DEFINER function-style read using a dedicated
--    role-less approach: switch the view to security_definer.
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, display_name, country, favorite_team_id, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
