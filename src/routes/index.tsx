import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/golazo/AppShell";
import { Header } from "@/components/golazo/Header";
import { MatchRow } from "@/components/golazo/MatchRow";
import { ScheduleAlertsBanner } from "@/components/golazo/ScheduleAlertsBanner";
import { useScheduleQuery } from "@/hooks/useScheduleQuery";
import { LIVE_STATUSES } from "@/lib/football-types";
import { CalendarDays, ChevronRight, Loader2, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FIFA FAN HUB — World Cup 2026 fan app" },
      { name: "description", content: "Live scores, full schedule, teams, and fan leaderboards for the FIFA World Cup 2026." },
      { property: "og:title", content: "FIFA FAN HUB — World Cup 2026 fan app" },
      { property: "og:description", content: "Live scores, schedule, and teams for World Cup 2026." },
    ],
  }),
  component: Index,
});

function Index() {
  const q = useScheduleQuery();
  const all = q.data?.matches ?? [];

  const live = useMemo(
    () => all.filter((m) => LIVE_STATUSES.includes(m.status)),
    [all],
  );
  const today = useMemo(() => {
    const now = new Date();
    return all
      .filter((m) => {
        const d = new Date(m.utcDate);
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          !LIVE_STATUSES.includes(m.status)
        );
      })
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());
  }, [all]);

  return (
    <AppShell>
      <Header />
      <ScheduleAlertsBanner />

      <section className="px-5 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl text-destructive">LIVE NOW</span>
            <span className="text-xs text-muted-foreground">
              {q.isLoading ? "loading…" : `· ${live.length} matches`}
            </span>
          </div>
          {q.isFetching && !q.isLoading && (
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
          )}
        </div>
        {live.length === 0 && !q.isLoading ? (
          <div className="rounded-xl border border-border bg-card px-4 py-5 text-center text-sm text-muted-foreground">
            No live matches right now.
          </div>
        ) : (
          <div className="space-y-2">
            {live.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 px-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">UPCOMING TODAY</h2>
          <Link to="/schedule" className="text-xs uppercase tracking-wider text-primary">
            Full schedule →
          </Link>
        </div>
        {today.length === 0 ? (
          <Link
            to="/schedule"
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground hover:border-primary/40"
          >
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={14} /> Nothing today — browse the full schedule
            </span>
            <ChevronRight size={14} />
          </Link>
        ) : (
          <div className="space-y-2">
            {today.slice(0, 4).map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 px-5">
        <h2 className="mb-3 font-display text-xl">EXPLORE</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/teams"
            className="rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-accent"
          >
            <Trophy size={18} className="text-primary" />
            <div className="mt-2 font-display text-lg leading-none">TEAMS</div>
            <div className="mt-1 text-xs text-muted-foreground">All 48 nations</div>
          </Link>
          <Link
            to="/leaderboards"
            className="rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-accent"
          >
            <ChevronRight size={18} className="text-primary" />
            <div className="mt-2 font-display text-lg leading-none">LEADERS</div>
            <div className="mt-1 text-xs text-muted-foreground">Fans · scorers</div>
          </Link>
        </div>
      </section>

      <footer className="mt-10 px-5 pb-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
        FIFA World Cup 2026 · USA · CAN · MEX
      </footer>
    </AppShell>
  );
}
