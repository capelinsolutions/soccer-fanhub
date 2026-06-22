import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/golazo/AppShell";
import { Header } from "@/components/golazo/Header";
import {
  getCountryFanCounts,
  getRecentFans,
  getTeamFanCounts,
} from "@/lib/community.functions";
import { getTopScorers } from "@/lib/football-extras.functions";

export const Route = createFileRoute("/leaderboards")({
  head: () => ({
    meta: [
      { title: "Leaderboards — FIFA FAN HUB" },
      { name: "description", content: "Top teams, top countries, and top scorers." },
    ],
  }),
  component: Leaderboards,
});

function Leaderboards() {
  const fetchTeams = useServerFn(getTeamFanCounts);
  const fetchCountries = useServerFn(getCountryFanCounts);
  const fetchRecent = useServerFn(getRecentFans);
  const fetchScorers = useServerFn(getTopScorers);

  const { data: teams = [] } = useQuery({ queryKey: ["lb-teams"], queryFn: () => fetchTeams() });
  const { data: countries = [] } = useQuery({ queryKey: ["lb-countries"], queryFn: () => fetchCountries() });
  const { data: recent = [] } = useQuery({ queryKey: ["lb-recent"], queryFn: () => fetchRecent({ data: { limit: 10 } }) });
  const { data: scorers = [] } = useQuery({ queryKey: ["lb-scorers"], queryFn: () => fetchScorers({ data: { limit: 10 } }) });

  return (
    <AppShell>
      <Header />
      <section className="px-5 pb-24 pt-4">
        <h1 className="font-display text-3xl">LEADERBOARDS</h1>

        <Block title="Most Supported Teams">
          {teams.filter((t) => Number(t.supporters) > 0).slice(0, 10).map((t, i) => (
            <Link
              key={t.team_id}
              to="/team/$id"
              params={{ id: String(t.team_id) }}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-sm hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono w-6 text-muted-foreground">#{i + 1}</span>
                {t.team_crest && <img src={t.team_crest} alt="" className="h-6 w-6 object-contain" />}
                <span className="font-medium">{t.team_name}</span>
              </div>
              <span className="font-mono">{t.supporters}</span>
            </Link>
          ))}
          {teams.filter((t) => Number(t.supporters) > 0).length === 0 && (
            <Empty>No fans have picked a team yet.</Empty>
          )}
        </Block>

        <Block title="Countries With Most Fans">
          {countries.slice(0, 10).map((c, i) => (
            <div key={c.country} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-mono w-6 text-muted-foreground">#{i + 1}</span>
                <span className="font-medium">{c.country}</span>
              </div>
              <span className="font-mono">{c.fans}</span>
            </div>
          ))}
          {countries.length === 0 && <Empty>No fans yet.</Empty>}
        </Block>

        <Block title="Recently Joined">
          {recent.map((f) => (
            <Link
              key={f.id}
              to="/u/$id"
              params={{ id: f.id }}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-sm hover:bg-accent"
            >
              <span className="font-medium">{f.display_name}</span>
              <span className="text-xs text-muted-foreground">
                {f.country ?? ""} · {new Date(f.created_at).toLocaleDateString()}
              </span>
            </Link>
          ))}
          {recent.length === 0 && <Empty>Be the first to sign up!</Empty>}
        </Block>

        <Block title="Top Scorers">
          {scorers.map((s: any, i: number) => (
            <div key={s.player_id} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-mono w-6 text-muted-foreground">#{i + 1}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{s.player_name}</span>
                  {s.team_name && (
                    <span className="text-xs text-muted-foreground">{s.team_name}</span>
                  )}
                </div>
              </div>
              <span className="font-mono">{s.goals} ⚽</span>
            </div>
          ))}
          {scorers.length === 0 && <Empty>Scorer data not loaded yet.</Empty>}
        </Block>
      </section>
    </AppShell>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-display text-xl">{title.toUpperCase()}</h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-card px-3 py-3 text-xs text-muted-foreground">
      {children}
    </p>
  );
}