export type ApiMatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "LIVE"
  | "FINISHED"
  | "POSTPONED"
  | "SUSPENDED"
  | "CANCELLED";

export type ApiTeam = {
  name: string;
  code: string; // 3-letter TLA (e.g. BRA)
  crest: string | null;
};

export type ApiMatch = {
  id: string;
  utcDate: string; // ISO
  status: ApiMatchStatus;
  stage: string;
  group: string | null;
  matchday: number | null;
  venue: string | null;
  minute: number | null;
  home: ApiTeam;
  away: ApiTeam;
  homeScore: number | null;
  awayScore: number | null;
};

export type ScheduleResult = {
  matches: ApiMatch[];
  source: "live" | "mock";
  fetchedAt: number;
  reason?: "NO_KEY" | "RATE_LIMIT" | "ERROR";
};

export const LIVE_STATUSES: ApiMatchStatus[] = ["LIVE", "IN_PLAY", "PAUSED"];

export const isLive = (s: ApiMatchStatus) => LIVE_STATUSES.includes(s);

// Flag emoji from FIFA-ish tri-code via a tiny lookup of TLA → ISO-2
const TLA_TO_ISO2: Record<string, string> = {
  ARG: "AR", AUS: "AU", AUT: "AT", BEL: "BE", BRA: "BR", CAN: "CA",
  CHI: "CL", CHN: "CN", COL: "CO", CRC: "CR", CRO: "HR", CZE: "CZ",
  DEN: "DK", ECU: "EC", EGY: "EG", ENG: "GB", ESP: "ES", FRA: "FR",
  GER: "DE", GHA: "GH", GRE: "GR", HUN: "HU", IRL: "IE", IRN: "IR",
  ISL: "IS", ITA: "IT", JPN: "JP", KOR: "KR", MAR: "MA", MEX: "MX",
  NED: "NL", NGA: "NG", NOR: "NO", NZL: "NZ", PAN: "PA", PAR: "PY",
  PER: "PE", POL: "PL", POR: "PT", QAT: "QA", ROU: "RO", RSA: "ZA",
  SAU: "SA", SCO: "GB", SEN: "SN", SRB: "RS", SUI: "CH", SVK: "SK",
  SVN: "SI", SWE: "SE", TUN: "TN", TUR: "TR", UKR: "UA", URU: "UY",
  USA: "US", WAL: "GB", UZB: "UZ", JOR: "JO", IRQ: "IQ", UAE: "AE",
  CIV: "CI", CMR: "CM", ALG: "DZ", LBY: "LY", JAM: "JM",
};

export function flagFor(tla: string): string {
  const iso = TLA_TO_ISO2[tla?.toUpperCase()];
  if (!iso || iso.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + iso.charCodeAt(0) - 65, A + iso.charCodeAt(1) - 65);
}