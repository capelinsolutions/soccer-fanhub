import { createServerFn } from "@tanstack/react-start";
import type {
  ApiMatch,
  ApiMatchStatus,
  ScheduleResult,
} from "./football-types";

const BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC";

type RawTeam = {
  id: number | null;
  name: string | null;
  shortName?: string | null;
  tla: string | null;
  crest: string | null;
};

type RawMatch = {
  id: number;
  utcDate: string;
  status: ApiMatchStatus;
  minute?: number | null;
  stage: string;
  group?: string | null;
  matchday?: number | null;
  venue?: string | null;
  homeTeam: RawTeam;
  awayTeam: RawTeam;
  score: { fullTime: { home: number | null; away: number | null } };
};

function normalize(m: RawMatch): ApiMatch {
  return {
    id: String(m.id),
    utcDate: m.utcDate,
    status: m.status,
    stage: m.stage,
    group: m.group ?? null,
    matchday: m.matchday ?? null,
    venue: m.venue ?? null,
    minute: m.minute ?? null,
    home: {
      name: m.homeTeam.shortName || m.homeTeam.name || "TBD",
      code: m.homeTeam.tla || "TBD",
      crest: m.homeTeam.crest,
    },
    away: {
      name: m.awayTeam.shortName || m.awayTeam.name || "TBD",
      code: m.awayTeam.tla || "TBD",
      crest: m.awayTeam.crest,
    },
    homeScore: m.score?.fullTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? null,
  };
}

// Mock fallback so the UI always renders even before the key works
// or when the API is rate-limited.
function mockFallback(): ApiMatch[] {
  const now = Date.now();
  const hours = (h: number) => new Date(now + h * 3600 * 1000).toISOString();
  return [
    {
      id: "mock-bra-arg",
      utcDate: hours(-1),
      status: "IN_PLAY",
      stage: "GROUP_STAGE",
      group: "Group A",
      matchday: 1,
      venue: "MetLife Stadium",
      minute: 68,
      home: { name: "Brazil", code: "BRA", crest: null },
      away: { name: "Argentina", code: "ARG", crest: null },
      homeScore: 1,
      awayScore: 1,
    },
    {
      id: "mock-esp-fra",
      utcDate: hours(-1),
      status: "IN_PLAY",
      stage: "GROUP_STAGE",
      group: "Group B",
      matchday: 1,
      venue: "SoFi Stadium",
      minute: 82,
      home: { name: "Spain", code: "ESP", crest: null },
      away: { name: "France", code: "FRA", crest: null },
      homeScore: 2,
      awayScore: 1,
    },
    {
      id: "mock-ger-eng",
      utcDate: hours(2),
      status: "SCHEDULED",
      stage: "GROUP_STAGE",
      group: "Group C",
      matchday: 1,
      venue: "AT&T Stadium",
      minute: null,
      home: { name: "Germany", code: "GER", crest: null },
      away: { name: "England", code: "ENG", crest: null },
      homeScore: null,
      awayScore: null,
    },
    {
      id: "mock-por-mar",
      utcDate: hours(5),
      status: "SCHEDULED",
      stage: "GROUP_STAGE",
      group: "Group D",
      matchday: 1,
      venue: "Estadio Azteca",
      minute: null,
      home: { name: "Portugal", code: "POR", crest: null },
      away: { name: "Morocco", code: "MAR", crest: null },
      homeScore: null,
      awayScore: null,
    },
    {
      id: "mock-jpn-sau",
      utcDate: hours(20),
      status: "SCHEDULED",
      stage: "GROUP_STAGE",
      group: "Group E",
      matchday: 1,
      venue: "BMO Field",
      minute: null,
      home: { name: "Japan", code: "JPN", crest: null },
      away: { name: "Saudi Arabia", code: "SAU", crest: null },
      homeScore: null,
      awayScore: null,
    },
    {
      id: "mock-usa-mex",
      utcDate: hours(28),
      status: "SCHEDULED",
      stage: "GROUP_STAGE",
      group: "Group F",
      matchday: 1,
      venue: "Rose Bowl",
      minute: null,
      home: { name: "USA", code: "USA", crest: null },
      away: { name: "Mexico", code: "MEX", crest: null },
      homeScore: null,
      awayScore: null,
    },
  ];
}

async function fetchFromApi(path: string): Promise<RawMatch[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    const err = new Error("NO_KEY");
    (err as any).reason = "NO_KEY";
    throw err;
  }
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": apiKey },
  });
  if (res.status === 429) {
    const err = new Error("RATE_LIMIT");
    (err as any).reason = "RATE_LIMIT";
    throw err;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[football-data] request failed", res.status, body);
    const err = new Error(`HTTP ${res.status}`);
    (err as any).reason = "ERROR";
    throw err;
  }
  const json = (await res.json()) as { matches?: RawMatch[] };
  return json.matches ?? [];
}

export const getSchedule = createServerFn({ method: "GET" }).handler(
  async (): Promise<ScheduleResult> => {
    try {
      const { getAllMatches, getWcTeams } = await import("./football-cache.server");
      const [teamsRes, matchesRes] = await Promise.all([
        getWcTeams(),
        getAllMatches(),
      ]);
      const teamById = new Map<number, any>();
      for (const t of teamsRes.data ?? []) teamById.set(t.id, t);
      const matches: ApiMatch[] = (matchesRes.data ?? []).map((m: any) => {
        const h = teamById.get(m.home_team_id) ?? {};
        const a = teamById.get(m.away_team_id) ?? {};
        return {
          id: String(m.id),
          utcDate: m.utc_date,
          status: (m.status ?? "SCHEDULED") as ApiMatchStatus,
          stage: m.stage ?? "",
          group: null,
          matchday: m.matchday ?? null,
          venue: null,
          minute: null,
          home: {
            name: h.short_name || h.name || "TBD",
            code: h.tla || "TBD",
            crest: h.crest ?? null,
          },
          away: {
            name: a.short_name || a.name || "TBD",
            code: a.tla || "TBD",
            crest: a.crest ?? null,
          },
          homeScore: m.home_score,
          awayScore: m.away_score,
        };
      });
      return {
        matches,
        source: matchesRes.source === "live" ? "live" : "live", // cache-first still "live" data
        fetchedAt: Date.now(),
      };
    } catch (e) {
      const reason = (e as any)?.reason ?? "ERROR";
      return {
        matches: mockFallback(),
        source: "mock",
        fetchedAt: Date.now(),
        reason,
      };
    }
  },
);

export const getLiveMatches = createServerFn({ method: "GET" }).handler(
  async (): Promise<ScheduleResult> => {
    try {
      const { getLiveMatchesRaw, getWcTeams } = await import("./football-cache.server");
      const [teamsRes, liveRes] = await Promise.all([
        getWcTeams(),
        getLiveMatchesRaw(),
      ]);
      const teamById = new Map<number, any>();
      for (const t of teamsRes.data ?? []) teamById.set(t.id, t);
      const matches: ApiMatch[] = (liveRes.data ?? []).map((m: any) => {
        const h = teamById.get(m.home_team_id) ?? {};
        const a = teamById.get(m.away_team_id) ?? {};
        return {
          id: String(m.id),
          utcDate: m.utc_date,
          status: (m.status ?? "IN_PLAY") as ApiMatchStatus,
          stage: m.stage ?? "",
          group: null,
          matchday: m.matchday ?? null,
          venue: null,
          minute: null,
          home: {
            name: h.short_name || h.name || "TBD",
            code: h.tla || "TBD",
            crest: h.crest ?? null,
          },
          away: {
            name: a.short_name || a.name || "TBD",
            code: a.tla || "TBD",
            crest: a.crest ?? null,
          },
          homeScore: m.home_score,
          awayScore: m.away_score,
        };
      });
      return {
        matches,
        source: "live",
        fetchedAt: Date.now(),
      };
    } catch (e) {
      const reason = (e as any)?.reason ?? "ERROR";
      const live = mockFallback().filter((m) =>
        ["LIVE", "IN_PLAY", "PAUSED"].includes(m.status),
      );
      return {
        matches: live,
        source: "mock",
        fetchedAt: Date.now(),
        reason,
      };
    }
  },
);

export const getMatchById = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("id required");
    return { id: String(input.id) };
  })
  .handler(async ({ data }): Promise<ApiMatch | null> => {
    try {
      const apiKey = process.env.FOOTBALL_DATA_API_KEY;
      if (!apiKey) throw Object.assign(new Error("NO_KEY"), { reason: "NO_KEY" });
      const res = await fetch(`${BASE}/matches/${data.id}`, {
        headers: { "X-Auth-Token": apiKey },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { match?: RawMatch } | RawMatch;
      const raw =
        ((json as { match?: RawMatch }).match as RawMatch) ??
        (json as RawMatch);
      if (!raw?.id) return null;
      return normalize(raw);
    } catch {
      const mock = mockFallback().find((m) => m.id === data.id);
      return mock ?? null;
    }
  });