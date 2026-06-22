
-- Recreate view as security_invoker so it respects caller's RLS
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, display_name, country, favorite_team_id, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Allow anon to SELECT rows from profiles, but only the safe columns
CREATE POLICY "Public can read non-sensitive profile fields"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (true);

-- Column-level grants: anon may only read safe columns (email excluded)
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT (id, display_name, country, favorite_team_id, created_at)
  ON public.profiles TO anon;

-- Authenticated keeps full access to their own row via the owner policy
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
