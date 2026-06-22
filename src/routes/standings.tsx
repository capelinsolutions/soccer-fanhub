import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/golazo/AppShell";
import { Header } from "@/components/golazo/Header";
import { getStandings } from "@/lib/football-extras.functions";

export const Route = createFileRoute("/standings")({
  head: () => ({
    meta: [
      { title: "Standings — FIFA FAN HUB" },
      { name: "description", content: "FIFA World Cup 2026 group standings." },
    ],
  }),
  component: StandingsPage,
});

type Row = {
  id: number;
  group_name: string | null;
  position: number | null;
  team_id: number | null;
  team_name: string | null;
  team_crest: string | null;
  team_tla: string | null;
  played_games: number | null;
  won: number | null;
  draw: number | null;
  lost: number | null;
  points: number | null;
  goals_for: number | null;
  goals_against: number | null;
  goal_difference: number | null;
};

function StandingsPage() {
  const fetchStandings = useServerFn(getStandings);
  const { data = [], isLoading } = useQuery({
    queryKey: ["standings"],
    queryFn: () => fetchStandings() as Promise<Row[]>,
    staleTime: 60 * 60 * 1000,
  });

  const groups = new Map<string, Row[]>();
  for (const r of data) {
    const key = r.group_name ?? "Overall";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  for (const rows of groups.values()) {
    rows.sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  }

  return (
    <AppShell>
      <Header />
      <section className="px-5 pb-24 pt-4">
        <h1 className="font-display text-3xl">STANDINGS</h1>
        <p className="text-sm text-muted-foreground">FIFA World Cup 2026.</p>

        {isLoading && (
          <p className="mt-6 text-sm text-muted-foreground">Loading standings…</p>
        )}
        {!isLoading && data.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            Standings will appear once group stage begins.
          </p>
        )}

        <div className="mt-6 space-y-8">
          {Array.from(groups.entries()).map(([group, rows]) => (
            <div key={group}>
              <h2 className="mb-2 font-display text-xl">{group}</h2>
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-background/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Team</th>
                      <th className="px-2 py-2 text-right">P</th>
                      <th className="px-2 py-2 text-right">W</th>
                      <th className="px-2 py-2 text-right">D</th>
                      <th className="px-2 py-2 text-right">L</th>
                      <th className="px-2 py-2 text-right">GD</th>
                      <th className="px-2 py-2 text-right font-bold">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="px-3 py-2 text-muted-foreground">{r.position}</td>
                        <td className="px-3 py-2">
                          {r.team_id ? (
                            <Link
                              to="/team/$id"
                              params={{ id: String(r.team_id) }}
                              className="flex items-center gap-2 hover:underline"
                            >
                              {r.team_crest ? (
                                <img src={r.team_crest} alt="" className="h-5 w-5 object-contain" />
                              ) : (
                                <span className="grid h-5 w-5 place-items-center rounded-full bg-background text-[9px] font-bold">
                                  {r.team_tla ?? "?"}
                                </span>
                              )}
                              <span className="font-medium">{r.team_name ?? "TBD"}</span>
                            </Link>
                          ) : (
                            <span className="font-medium">TBD</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right font-mono">{r.played_games}</td>
                        <td className="px-2 py-2 text-right font-mono">{r.won}</td>
                        <td className="px-2 py-2 text-right font-mono">{r.draw}</td>
                        <td className="px-2 py-2 text-right font-mono">{r.lost}</td>
                        <td className="px-2 py-2 text-right font-mono">{r.goal_difference}</td>
                        <td className="px-2 py-2 text-right font-mono font-bold">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}