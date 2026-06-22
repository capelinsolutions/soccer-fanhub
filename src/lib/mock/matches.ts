export type Match = {
  id: string;
  home: { name: string; code: string; flag: string };
  away: { name: string; code: string; flag: string };
  status: "LIVE" | "UPCOMING" | "FT";
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  kickoff?: string;
  fansInRoom?: number;
};

export const matches: Match[] = [
  {
    id: "bra-arg",
    home: { name: "Brazil", code: "BRA", flag: "🇧🇷" },
    away: { name: "Argentina", code: "ARG", flag: "🇦🇷" },
    status: "LIVE",
    minute: 68,
    homeScore: 1,
    awayScore: 1,
    fansInRoom: 2341,
  },
  {
    id: "usa-mex",
    home: { name: "USA", code: "USA", flag: "🇺🇸" },
    away: { name: "Mexico", code: "MEX", flag: "🇲🇽" },
    status: "LIVE",
    minute: 34,
    homeScore: 0,
    awayScore: 0,
    fansInRoom: 1812,
  },
  {
    id: "esp-fra",
    home: { name: "Spain", code: "ESP", flag: "🇪🇸" },
    away: { name: "France", code: "FRA", flag: "🇫🇷" },
    status: "LIVE",
    minute: 82,
    homeScore: 2,
    awayScore: 1,
    fansInRoom: 3104,
  },
  {
    id: "ger-eng",
    home: { name: "Germany", code: "GER", flag: "🇩🇪" },
    away: { name: "England", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    status: "UPCOMING",
    kickoff: "Today · 6:00 PM",
  },
  {
    id: "por-mar",
    home: { name: "Portugal", code: "POR", flag: "🇵🇹" },
    away: { name: "Morocco", code: "MAR", flag: "🇲🇦" },
    status: "UPCOMING",
    kickoff: "Today · 9:00 PM",
  },
  {
    id: "jpn-sau",
    home: { name: "Japan", code: "JPN", flag: "🇯🇵" },
    away: { name: "Saudi Arabia", code: "SAU", flag: "🇸🇦" },
    status: "UPCOMING",
    kickoff: "Tomorrow · 12:00 PM",
  },
  {
    id: "aus-kor",
    home: { name: "Australia", code: "AUS", flag: "🇦🇺" },
    away: { name: "South Korea", code: "KOR", flag: "🇰🇷" },
    status: "UPCOMING",
    kickoff: "Tomorrow · 3:00 PM",
  },
];

export const getMatch = (id: string) => matches.find((m) => m.id === id);