import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/golazo/AppShell";
import { Header } from "@/components/golazo/Header";
import { getTeamFanCounts } from "@/lib/community.functions";
import { getWcTeams } from "@/lib/football-extras.functions";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "Teams — FIFA FAN HUB" },
      { name: "description", content: "All World Cup 2026 teams with their fan counts." },
    ],
  }),
  component: TeamsPage,
});

function TeamsPage() {
  const fetchCounts = useServerFn(getTeamFanCounts);
  const fetchTeams = useServerFn(getWcTeams);
  const { data: counts = [] } = useQuery({
    queryKey: ["team-fan-counts"],
    queryFn: () => fetchCounts(),
  });
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["wc-teams"],
    queryFn: () => fetchTeams(),
    staleTime: 60 * 60 * 1000,
  });

  const countByTeam = new Map<number, number>();
  for (const c of counts) countByTeam.set(c.team_id, Number(c.supporters ?? 0));

  const merged = teams
    .map((t) => ({ ...t, supporters: countByTeam.get(t.id) ?? 0 }))
    .sort((a, b) => b.supporters - a.supporters || (a.name ?? "").localeCompare(b.name ?? ""));

  return (
    <AppShell>
      <Header />
      <section className="px-5 pb-24 pt-4">
        <h1 className="font-display text-3xl">TEAMS</h1>
        <p className="text-sm text-muted-foreground">FIFA World Cup 2026.</p>
        {isLoading && (
          <p className="mt-6 text-sm text-muted-foreground">Loading teams…</p>
        )}
        {!isLoading && merged.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            Teams will appear once they're loaded from the live data feed.
          </p>
        )}
        <ul className="mt-4 space-y-2">
          {merged.map((t) => (
            <li key={t.id}>
              <Link
                to="/team/$id"
                params={{ id: String(t.id) }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 transition-colors hover:bg-accent"
              >
                {t.crest ? (
                  <img src={t.crest} alt="" className="h-10 w-10 object-contain" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-background text-xs font-bold">
                    {t.tla ?? "?"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.area_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg">{t.supporters}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    fans
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}