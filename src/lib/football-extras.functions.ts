import { createServerFn } from "@tanstack/react-start";

export type WcTeam = {
  id: number;
  name: string | null;
  short_name: string | null;
  tla: string | null;
  crest: string | null;
  area_name: string | null;
  coach_name: string | null;
};

export const getWcTeams = createServerFn({ method: "GET" }).handler(async (): Promise<WcTeam[]> => {
  try {
    const { getWcTeams } = await import("./football-cache.server");
    const r = await getWcTeams();
    return (r.data ?? []) as WcTeam[];
  } catch (e) {
    console.error("[getWcTeams]", e);
    return [];
  }
});

export const getTeamDetail = createServerFn({ method: "GET" })
  .validator((input: { teamId: number | string }) => ({
    teamId: Number(input.teamId),
  }))
  .handler(async ({ data }) => {
    const { getTeamById, getTeamPlayers, getAllMatches, getWcTeams } =
      await import("./football-cache.server");
    const [teamRes, playersRes, matchesRes, teamsRes] = await Promise.all([
      getTeamById(data.teamId),
      getTeamPlayers(data.teamId),
      getAllMatches(),
      getWcTeams(),
    ]);
    const nameById = new Map<number, { name: string | null; crest: string | null }>();
    for (const t of (teamsRes.data ?? []) as any[]) {
      nameById.set(t.id, { name: t.name ?? null, crest: t.crest ?? null });
    }
    const teamMatches = (matchesRes.data ?? [])
      .filter((m: any) => m.home_team_id === data.teamId || m.away_team_id === data.teamId)
      .map((m: any) => ({
        ...m,
        home_team_name: nameById.get(m.home_team_id)?.name ?? null,
        away_team_name: nameById.get(m.away_team_id)?.name ?? null,
        home_team_crest: nameById.get(m.home_team_id)?.crest ?? null,
        away_team_crest: nameById.get(m.away_team_id)?.crest ?? null,
      }));
    return {
      team: teamRes.data,
      players: playersRes.data ?? [],
      matches: teamMatches,
    };
  });

export const getStandings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getStandings, getWcTeams } = await import("./football-cache.server");
    const [r, teamsRes] = await Promise.all([getStandings(), getWcTeams()]);
    const teamById = new Map<
      number,
      { name: string | null; crest: string | null; tla: string | null }
    >();
    for (const t of (teamsRes.data ?? []) as any[]) {
      teamById.set(t.id, { name: t.name ?? null, crest: t.crest ?? null, tla: t.tla ?? null });
    }
    return (r.data ?? []).map((s: any) => ({
      ...s,
      team_name: s.team_id ? (teamById.get(s.team_id)?.name ?? null) : null,
      team_crest: s.team_id ? (teamById.get(s.team_id)?.crest ?? null) : null,
      team_tla: s.team_id ? (teamById.get(s.team_id)?.tla ?? null) : null,
    }));
  } catch (e) {
    console.error("[getStandings]", e);
    return [];
  }
});

export const getTopScorers = createServerFn({ method: "GET" })
  .validator((input?: { limit?: number }) => ({
    limit: Math.min(Math.max(input?.limit ?? 10, 1), 50),
  }))
  .handler(async ({ data }) => {
    try {
      const { getScorers, getWcTeams } = await import("./football-cache.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [r, teamsRes] = await Promise.all([getScorers(), getWcTeams()]);
      const rows = (r.data ?? []).slice(0, data.limit);
      const playerIds = rows.map((s: any) => s.player_id).filter(Boolean);
      const { data: players } = await supabaseAdmin
        .from("players")
        .select("id,name")
        .in("id", playerIds);
      const playerName = new Map<number, string>();
      for (const p of players ?? []) playerName.set(p.id, p.name ?? "");
      const teamName = new Map<number, string>();
      for (const t of (teamsRes.data ?? []) as any[]) teamName.set(t.id, t.name ?? "");
      return rows.map((s: any) => ({
        ...s,
        player_name: playerName.get(s.player_id) ?? "Unknown",
        team_name: s.team_id ? (teamName.get(s.team_id) ?? null) : null,
      }));
    } catch (e) {
      console.error("[getTopScorers]", e);
      return [];
    }
  });
