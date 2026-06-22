// Server-only cache + upsert helpers backed by Supabase.
// Never import this from client code.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC";

export const TTL = {
  competitions: 30 * 24 * 60 * 60 * 1000, // 30 days
  teams: Infinity, // permanent
  players: 7 * 24 * 60 * 60 * 1000, // 7 days
  matches: 60 * 60 * 1000, // 1 hour
  standings: 60 * 60 * 1000, // 1 hour
  scorers: 60 * 60 * 1000, // 1 hour
  liveMatches: 60 * 1000, // 1 minute
};

export type FetchReason = "NO_KEY" | "RATE_LIMIT" | "ERROR";

export async function callFootballApi<T = any>(path: string): Promise<T> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    const err: any = new Error("NO_KEY");
    err.reason = "NO_KEY" as FetchReason;
    throw err;
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": apiKey },
  });
  if (res.status === 429) {
    const err: any = new Error("RATE_LIMIT");
    err.reason = "RATE_LIMIT" as FetchReason;
    throw err;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[football-data] failed", res.status, body);
    const err: any = new Error(`HTTP ${res.status}`);
    err.reason = "ERROR" as FetchReason;
    throw err;
  }
  return (await res.json()) as T;
}

function isFresh(lastUpdated: string | null | undefined, ttlMs: number) {
  if (!lastUpdated) return false;
  if (ttlMs === Infinity) return true;
  return Date.now() - new Date(lastUpdated).getTime() < ttlMs;
}

// =========================
// COMPETITION
// =========================
export async function getCompetition() {
  const { data: cached } = await supabaseAdmin
    .from("competitions")
    .select("*")
    .eq("code", COMPETITION)
    .maybeSingle();
  if (cached && isFresh(cached.last_updated, TTL.competitions)) {
    return { data: cached, source: "cache" as const };
  }
  try {
    const raw = await callFootballApi<any>(`/competitions/${COMPETITION}`);
    const row = {
      id: raw.id,
      code: raw.code,
      name: raw.name,
      type: raw.type,
      emblem: raw.emblem,
      current_season: raw.currentSeason ?? null,
      last_updated: new Date().toISOString(),
    };
    await supabaseAdmin.from("competitions").upsert(row);
    return { data: row, source: "live" as const };
  } catch (e: any) {
    return { data: cached ?? null, source: "cache" as const, reason: e?.reason };
  }
}

// =========================
// TEAMS
// =========================
export async function getWcTeams() {
  const { count } = await supabaseAdmin
    .from("teams")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    const { data } = await supabaseAdmin
      .from("teams")
      .select("*")
      .order("name");
    return { data: data ?? [], source: "cache" as const };
  }
  try {
    const raw = await callFootballApi<{ teams: any[] }>(
      `/competitions/${COMPETITION}/teams`,
    );
    const rows = (raw.teams ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      short_name: t.shortName ?? null,
      tla: t.tla ?? null,
      crest: t.crest ?? null,
      area_name: t.area?.name ?? null,
      coach_name: t.coach?.name ?? null,
      last_updated: new Date().toISOString(),
    }));
    if (rows.length) await supabaseAdmin.from("teams").upsert(rows);
    return { data: rows, source: "live" as const };
  } catch (e: any) {
    return { data: [], source: "cache" as const, reason: e?.reason };
  }
}

export async function getTeamById(id: number) {
  const { data: cached } = await supabaseAdmin
    .from("teams")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (cached) return { data: cached, source: "cache" as const };
  // try to fetch via WC teams refresh
  await getWcTeams();
  const { data: fresh } = await supabaseAdmin
    .from("teams")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return { data: fresh, source: "live" as const };
}

// =========================
// PLAYERS (squad)
// =========================
export async function getTeamPlayers(teamId: number) {
  const { data: cached } = await supabaseAdmin
    .from("players")
    .select("*")
    .eq("team_id", teamId)
    .order("name");
  const stale =
    !cached?.length ||
    !isFresh(cached[0].last_updated, TTL.players);
  if (!stale) return { data: cached, source: "cache" as const };
  try {
    const raw = await callFootballApi<any>(`/teams/${teamId}`);
    const squad = raw?.squad ?? [];
    const rows = squad.map((p: any) => ({
      id: p.id,
      name: p.name,
      position: p.position ?? null,
      date_of_birth: p.dateOfBirth ?? null,
      nationality: p.nationality ?? null,
      team_id: teamId,
      last_updated: new Date().toISOString(),
    }));
    if (rows.length) await supabaseAdmin.from("players").upsert(rows);
    return { data: rows, source: "live" as const };
  } catch (e: any) {
    return { data: cached ?? [], source: "cache" as const, reason: e?.reason };
  }
}

// =========================
// MATCHES
// =========================
type MatchRow = {
  id: number;
  utc_date: string | null;
  status: string | null;
  stage: string | null;
  matchday: number | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
  last_updated: string;
};

function mapMatch(m: any): MatchRow {
  return {
    id: m.id,
    utc_date: m.utcDate ?? null,
    status: m.status ?? null,
    stage: m.stage ?? null,
    matchday: m.matchday ?? null,
    home_team_id: m.homeTeam?.id ?? null,
    away_team_id: m.awayTeam?.id ?? null,
    home_score: m.score?.fullTime?.home ?? null,
    away_score: m.score?.fullTime?.away ?? null,
    winner: m.score?.winner ?? null,
    last_updated: new Date().toISOString(),
  };
}

async function newestMatchAt(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("matches")
    .select("last_updated")
    .order("last_updated", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.last_updated as string) ?? null;
}

async function upsertTeamShellsFromMatches(matches: any[]) {
  const seen = new Map<number, any>();
  for (const m of matches) {
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (t?.id && !seen.has(t.id)) {
        seen.set(t.id, {
          id: t.id,
          name: t.name ?? null,
          short_name: t.shortName ?? null,
          tla: t.tla ?? null,
          crest: t.crest ?? null,
          last_updated: new Date().toISOString(),
        });
      }
    }
  }
  if (seen.size) {
    await supabaseAdmin
      .from("teams")
      .upsert(Array.from(seen.values()), { onConflict: "id", ignoreDuplicates: true });
  }
}

export async function getAllMatches() {
  const newest = await newestMatchAt();
  if (isFresh(newest, TTL.matches)) {
    const { data } = await supabaseAdmin
      .from("matches")
      .select("*")
      .order("utc_date");
    return { data: data ?? [], source: "cache" as const };
  }
  try {
    const raw = await callFootballApi<{ matches: any[] }>(
      `/competitions/${COMPETITION}/matches`,
    );
    const matches = raw.matches ?? [];
    await upsertTeamShellsFromMatches(matches);
    const rows = matches.map(mapMatch);
    if (rows.length) await supabaseAdmin.from("matches").upsert(rows);
    const { data } = await supabaseAdmin
      .from("matches")
      .select("*")
      .order("utc_date");
    return { data: data ?? [], source: "live" as const };
  } catch (e: any) {
    const { data } = await supabaseAdmin
      .from("matches")
      .select("*")
      .order("utc_date");
    return { data: data ?? [], source: "cache" as const, reason: e?.reason };
  }
}

export async function getLiveMatchesRaw() {
  // Live matches: always go direct, optionally cache for 1 minute.
  try {
    const raw = await callFootballApi<{ matches: any[] }>(
      `/competitions/${COMPETITION}/matches?status=LIVE,IN_PLAY,PAUSED`,
    );
    const matches = raw.matches ?? [];
    await upsertTeamShellsFromMatches(matches);
    const rows = matches.map(mapMatch);
    if (rows.length) await supabaseAdmin.from("matches").upsert(rows);
    return { data: rows, source: "live" as const };
  } catch (e: any) {
    const { data } = await supabaseAdmin
      .from("matches")
      .select("*")
      .in("status", ["LIVE", "IN_PLAY", "PAUSED"]);
    return { data: data ?? [], source: "cache" as const, reason: e?.reason };
  }
}

// =========================
// STANDINGS
// =========================
export async function getStandings() {
  const { data: cached } = await supabaseAdmin
    .from("standings")
    .select("*")
    .order("group_name")
    .order("position");
  // Cache-first: if we have any standings rows, return them without hitting the API.
  if (cached?.length) return { data: cached, source: "cache" as const };
  try {
    const raw = await callFootballApi<{ standings: any[] }>(
      `/competitions/${COMPETITION}/standings`,
    );
    const rows: any[] = [];
    for (const grp of raw.standings ?? []) {
      const name = grp.group ?? grp.stage ?? "Overall";
      for (const row of grp.table ?? []) {
        rows.push({
          group_name: name,
          position: row.position,
          team_id: row.team?.id,
          played_games: row.playedGames ?? 0,
          won: row.won ?? 0,
          draw: row.draw ?? 0,
          lost: row.lost ?? 0,
          points: row.points ?? 0,
          goals_for: row.goalsFor ?? 0,
          goals_against: row.goalsAgainst ?? 0,
          goal_difference: row.goalDifference ?? 0,
          last_updated: new Date().toISOString(),
        });
      }
    }
    if (rows.length) {
      await supabaseAdmin.from("standings").upsert(rows, {
        onConflict: "group_name,team_id",
      });
    }
    const { data } = await supabaseAdmin
      .from("standings")
      .select("*")
      .order("group_name")
      .order("position");
    return { data: data ?? [], source: "live" as const };
  } catch (e: any) {
    return { data: cached ?? [], source: "cache" as const, reason: e?.reason };
  }
}

// =========================
// SCORERS
// =========================
export async function getScorers() {
  const { data: cached } = await supabaseAdmin
    .from("scorers")
    .select("*")
    .order("goals", { ascending: false });
  const fresh = cached?.length && isFresh(cached[0].last_updated, TTL.scorers);
  if (fresh) return { data: cached, source: "cache" as const };
  try {
    const raw = await callFootballApi<{ scorers: any[] }>(
      `/competitions/${COMPETITION}/scorers`,
    );
    const playerRows: any[] = [];
    const scorerRows: any[] = [];
    for (const s of raw.scorers ?? []) {
      if (s.player?.id) {
        playerRows.push({
          id: s.player.id,
          name: s.player.name ?? null,
          position: s.player.position ?? null,
          date_of_birth: s.player.dateOfBirth ?? null,
          nationality: s.player.nationality ?? null,
          team_id: s.team?.id ?? null,
          last_updated: new Date().toISOString(),
        });
        scorerRows.push({
          player_id: s.player.id,
          team_id: s.team?.id ?? null,
          goals: s.goals ?? 0,
          assists: s.assists ?? 0,
          played_matches: s.playedMatches ?? 0,
          last_updated: new Date().toISOString(),
        });
      }
    }
    if (playerRows.length) await supabaseAdmin.from("players").upsert(playerRows);
    if (scorerRows.length) await supabaseAdmin.from("scorers").upsert(scorerRows);
    const { data } = await supabaseAdmin
      .from("scorers")
      .select("*")
      .order("goals", { ascending: false });
    return { data: data ?? [], source: "live" as const };
  } catch (e: any) {
    return { data: cached ?? [], source: "cache" as const, reason: e?.reason };
  }
}