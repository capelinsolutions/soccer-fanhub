import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export type PublicProfile = {
  id: string;
  display_name: string;
  country: string | null;
  favorite_team_id: number | null;
  created_at: string;
};

export const getProfileById = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }): Promise<PublicProfile | null> => {
    const sb = publicClient();
    const { data: row } = await sb
      .from("profiles")
      .select("id, display_name, country, favorite_team_id, created_at")
      .eq("id", data.id)
      .maybeSingle();
    return (row as PublicProfile) ?? null;
  });

export const listFans = createServerFn({ method: "GET" })
  .validator((input?: { teamId?: number | null; limit?: number }) => ({
    teamId: input?.teamId != null ? Number(input.teamId) : null,
    limit: Math.min(Math.max(input?.limit ?? 50, 1), 200),
  }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb
      .from("profiles")
      .select("id, display_name, country, favorite_team_id, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.teamId != null) q = q.eq("favorite_team_id", data.teamId);
    const { data: rows } = await q;
    return (rows ?? []) as PublicProfile[];
  });

export const getTeamFanCounts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb
    .from("team_fan_counts")
    .select("team_id, team_name, short_name, tla, team_crest, supporters")
    .order("supporters", { ascending: false });
  return (data ?? []) as Array<{
    team_id: number;
    team_name: string | null;
    short_name: string | null;
    tla: string | null;
    team_crest: string | null;
    supporters: number;
  }>;
});

export const getCountryFanCounts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb.from("profiles").select("country");
  const counts = new Map<string, number>();
  for (const r of data ?? []) {
    const c = (r as any).country?.trim();
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return Array.from(counts, ([country, fans]) => ({ country, fans }))
    .sort((a, b) => b.fans - a.fans)
    .slice(0, 50);
});

export const getRecentFans = createServerFn({ method: "GET" })
  .validator((input?: { limit?: number }) => ({
    limit: Math.min(Math.max(input?.limit ?? 20, 1), 100),
  }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows } = await sb
      .from("profiles")
      .select("id, display_name, country, favorite_team_id, created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    return (rows ?? []) as PublicProfile[];
  });
