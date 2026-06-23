-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  country TEXT,
  favorite_team_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

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

-- =========================================================
-- updated_at trigger helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- Auto-create profile on signup, reading metadata supplied at signUp().
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, country, favorite_team_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'country', ''),
    NULLIF(NEW.raw_user_meta_data->>'favorite_team_id', '')::BIGINT
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- Email-free public view for community/leaderboard features
-- =========================================================
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, display_name, country, favorite_team_id, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- =========================================================
-- COMPETITIONS
-- =========================================================
CREATE TABLE public.competitions (
  id BIGINT PRIMARY KEY,
  code TEXT,
  name TEXT,
  type TEXT,
  emblem TEXT,
  current_season JSONB,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.competitions TO anon, authenticated;
GRANT ALL ON public.competitions TO service_role;

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Competitions are publicly readable"
  ON public.competitions FOR SELECT
  USING (true);

-- =========================================================
-- TEAMS
-- =========================================================
CREATE TABLE public.teams (
  id BIGINT PRIMARY KEY,
  name TEXT,
  short_name TEXT,
  tla TEXT,
  crest TEXT,
  area_name TEXT,
  coach_name TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.teams TO anon, authenticated;
GRANT ALL ON public.teams TO service_role;

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teams are publicly readable"
  ON public.teams FOR SELECT
  USING (true);

-- Link profiles.favorite_team_id to teams now that teams exists.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_favorite_team_fk
  FOREIGN KEY (favorite_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- =========================================================
-- PLAYERS
-- =========================================================
CREATE TABLE public.players (
  id BIGINT PRIMARY KEY,
  name TEXT,
  position TEXT,
  date_of_birth DATE,
  nationality TEXT,
  team_id BIGINT REFERENCES public.teams(id) ON DELETE SET NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.players TO anon, authenticated;
GRANT ALL ON public.players TO service_role;

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players are publicly readable"
  ON public.players FOR SELECT
  USING (true);

CREATE INDEX players_team_id_idx ON public.players(team_id);

-- =========================================================
-- MATCHES
-- =========================================================
CREATE TABLE public.matches (
  id BIGINT PRIMARY KEY,
  utc_date TIMESTAMPTZ,
  status TEXT,
  stage TEXT,
  matchday INT,
  home_team_id BIGINT REFERENCES public.teams(id) ON DELETE SET NULL,
  away_team_id BIGINT REFERENCES public.teams(id) ON DELETE SET NULL,
  home_score INT,
  away_score INT,
  winner TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.matches TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are publicly readable"
  ON public.matches FOR SELECT
  USING (true);

CREATE INDEX matches_utc_date_idx ON public.matches(utc_date);
CREATE INDEX matches_status_idx ON public.matches(status);
CREATE INDEX matches_home_team_idx ON public.matches(home_team_id);
CREATE INDEX matches_away_team_idx ON public.matches(away_team_id);

-- =========================================================
-- STANDINGS
-- =========================================================
CREATE TABLE public.standings (
  id BIGSERIAL PRIMARY KEY,
  group_name TEXT,
  position INT,
  team_id BIGINT REFERENCES public.teams(id) ON DELETE CASCADE,
  played_games INT DEFAULT 0,
  won INT DEFAULT 0,
  draw INT DEFAULT 0,
  lost INT DEFAULT 0,
  points INT DEFAULT 0,
  goals_for INT DEFAULT 0,
  goals_against INT DEFAULT 0,
  goal_difference INT DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_name, team_id)
);

GRANT SELECT ON public.standings TO anon, authenticated;
GRANT ALL ON public.standings TO service_role;

ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Standings are publicly readable"
  ON public.standings FOR SELECT
  USING (true);

CREATE INDEX standings_group_idx ON public.standings(group_name, position);

-- =========================================================
-- SCORERS
-- =========================================================
CREATE TABLE public.scorers (
  player_id BIGINT PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
  team_id BIGINT REFERENCES public.teams(id) ON DELETE SET NULL,
  goals INT DEFAULT 0,
  assists INT DEFAULT 0,
  played_matches INT DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.scorers TO anon, authenticated;
GRANT ALL ON public.scorers TO service_role;

ALTER TABLE public.scorers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scorers are publicly readable"
  ON public.scorers FOR SELECT
  USING (true);

CREATE INDEX scorers_goals_idx ON public.scorers(goals DESC);

-- =========================================================
-- TEAM FAN COUNTS VIEW
-- =========================================================
CREATE OR REPLACE VIEW public.team_fan_counts
WITH (security_invoker = true) AS
SELECT
  t.id           AS team_id,
  t.name         AS team_name,
  t.short_name,
  t.tla,
  t.crest        AS team_crest,
  COUNT(p.id)    AS supporters
FROM public.teams t
LEFT JOIN public.profiles p ON p.favorite_team_id = t.id
GROUP BY t.id, t.name, t.short_name, t.tla, t.crest;

GRANT SELECT ON public.team_fan_counts TO anon, authenticated;
