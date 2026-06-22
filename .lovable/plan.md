## Goal

Replace the mock match data with real FIFA World Cup 2026 fixtures and live scores from **football-data.org**, plus a full schedule with change alerts and a "my countries" filter.

## Setup

1. User creates a free account at football-data.org → copies their API token.
2. I'll request it as a secret: `FOOTBALL_DATA_API_KEY`.
3. Competition code: `WC` (FIFA World Cup).

## Server (TanStack server functions)

`src/lib/football.functions.ts` — never exposes the key to the browser:

- `getSchedule()` → `GET v4/competitions/WC/matches`. Returns normalized DTO: `{ id, utcDate, status, stage, group, home, away, homeScore, awayScore, minute, venue }`. Cached 5 min via React Query.
- `getLiveMatches()` → `GET v4/competitions/WC/matches?status=LIVE,IN_PLAY,PAUSED`. Lightweight payload for polling.
- `getMatch(id)` → single match detail for `/match/$id`.

Graceful fallback: on API error or rate-limit (429), return the existing mock matches so the UI never breaks.

## Polling (client)

TanStack Query in components:
- Live scores: `refetchInterval: 30_000` when at least one match status ∈ {LIVE, IN_PLAY, PAUSED}; otherwise `5 * 60_000`.
- Schedule: `staleTime: 5 min`, refetch on focus.

## Schedule change detection

`src/context/ScheduleContext.tsx`:
- Persist last-seen snapshot `{ matchId → { utcDate, venue, status } }` in `localStorage` (`golazo.schedule.snapshot`).
- After every fetch, diff against snapshot. For each change build a `ScheduleAlert`: kickoff moved, venue changed, postponed, cancelled.
- Expose `alerts[]` + `dismiss(id)`.

UI:
- `<ScheduleAlertsBanner />` mounted in `AppShell` (top of `main`) — yellow strip "3 schedule updates → View".
- Tapping it opens a sheet listing changes with old → new values.

## Routes

- `src/routes/schedule.tsx` — new route. Tabs: **All · Live · Today · My Teams**. Grouped by date, then by stage (Group A–H, Round of 32, etc.). Each row links to `/match/$id`.
- `src/routes/index.tsx` — replace the static "Live now" section with `<TodayMatches />` (live + upcoming today, sorted by kickoff).
- `src/routes/match.$id.tsx` — keep chat; replace mock header score with live score from `getMatch(id)` polled at 30s when live.

## BottomNav

Replace "Parties" position? No — keep nav as-is. Schedule is reachable from Home ("See full schedule →") and from a small "Schedule" chip in the header. (Confirm in build if you'd rather swap a tab.)

## "My Teams" filter

Reads `user.countries` from `UserContext`. Matches a fixture if either `home.code` or `away.code` is in the list (football-data uses FIFA tri-codes like `BRA`, `ARG` — already what the mock uses).

## Components

- `src/components/golazo/TodayMatches.tsx`
- `src/components/golazo/LiveScoreBadge.tsx` — pulse dot + `minute' · 2—1`
- `src/components/golazo/ScheduleList.tsx`
- `src/components/golazo/ScheduleAlertsBanner.tsx`
- `src/components/golazo/ScheduleChangeSheet.tsx`

## Failure modes handled

- Missing API key → server fn throws a typed `{ ok:false, reason:"NO_KEY" }`; UI shows a one-line "Connect live data" hint in the schedule (only visible to you in dev).
- 429 rate-limit → exponential backoff, keep last successful payload.
- Tournament not started yet → football-data still returns the full fixture list once published; until then, scores are `null` and we just show kickoff times.

## Out of scope (this pass)

- Push notifications for schedule changes (only in-app banner).
- Lineups / events / goal scorers (would require API-Football, paid tier).

---

**Next step after you approve:** I'll switch to build mode, ask for the `FOOTBALL_DATA_API_KEY` secret, and implement in this order: server fns → schedule context → /schedule route → Home integration → match page live score → alerts banner.