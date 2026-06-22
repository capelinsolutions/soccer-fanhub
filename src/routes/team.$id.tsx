import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Users, ChevronDown, ChevronUp } from "lucide-react";
import { AppShell } from "@/components/golazo/AppShell";
import { getTeamDetail } from "@/lib/football-extras.functions";
import { listFans } from "@/lib/community.functions";
import { useState } from "react";

export const Route = createFileRoute("/team/$id")({
  head: () => ({
    meta: [
      { title: "Team — FIFA FAN HUB" },
      { name: "description", content: "Squad, schedule, and supporters." },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const teamId = Number(id);
  const fetchDetail = useServerFn(getTeamDetail);
  const fetchFans = useServerFn(listFans);
  
  const [showFullSquad, setShowFullSquad] = useState(false);
  const [showFullSupporters, setShowFullSupporters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["team-detail", teamId],
    queryFn: () => fetchDetail({ data: { teamId } }),
    staleTime: 5 * 60 * 1000,
  });
  const { data: fans = [] } = useQuery({
    queryKey: ["team-fans", teamId],
    queryFn: () => fetchFans({ data: { teamId, limit: 100 } }),
  });

  if (isLoading || !data) {
    return (
      <AppShell hideNav>
        <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
          Loading team…
        </div>
      </AppShell>
    );
  }
  if (!data.team) {
    return (
      <AppShell hideNav>
        <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
          Team not found.{" "}
          <Link to="/teams" className="ml-2 text-primary underline">Browse teams</Link>
        </div>
      </AppShell>
    );
  }

  const team = data.team as any;
  const now = Date.now();
  const upcoming = data.matches.filter(
    (m: any) => m.utc_date && new Date(m.utc_date).getTime() >= now,
  );
  const past = data.matches.filter(
    (m: any) => m.utc_date && new Date(m.utc_date).getTime() < now,
  );

  // Initial display - show first 4 players and first 3 supporters
  const initialPlayers = data.players.slice(0, 4);
  const remainingPlayers = data.players.slice(4);
  const initialSupporters = fans.slice(0, 3);
  const remainingSupporters = fans.slice(3);

  return (
    <AppShell hideNav>
      <div className="min-h-screen pb-16 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="relative h-48 bg-gradient-to-br from-primary/30 to-background">
          <button
            onClick={() => router.history.back()}
            className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/80 backdrop-blur"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 p-5">
            {team.crest && (
              <img src={team.crest} alt="" className="h-20 w-20 object-contain drop-shadow" />
            )}
            <div>
              <h1 className="font-display text-3xl leading-none">{team.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{team.area_name}</p>
              {team.coach_name && (
                <p className="text-xs text-muted-foreground">Coach: {team.coach_name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-5">
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Users size={16} className="text-primary" />
              <span className="font-semibold">{fans.length}</span> supporter{fans.length === 1 ? "" : "s"}
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              World Cup 2026
            </span>
          </div>

          <Section title="Upcoming">
            {upcoming.length === 0 ? (
              <Empty>No upcoming fixtures yet.</Empty>
            ) : (
              upcoming.slice(0, 6).map((m: any) => <MatchLine key={m.id} m={m} teamId={teamId} />)
            )}
          </Section>

          <Section title="Previous">
            {past.length === 0 ? (
              <Empty>No matches played yet.</Empty>
            ) : (
              past.slice(-6).reverse().map((m: any) => <MatchLine key={m.id} m={m} teamId={teamId} />)
            )}
          </Section>

          <Section title="Squad">
            {data.players.length === 0 ? (
              <Empty>Squad data unavailable.</Empty>
            ) : (
              <>
                <ul className="grid grid-cols-2 gap-2">
                  {initialPlayers.map((p: any) => (
                    <li key={p.id} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.position ?? "—"}</div>
                    </li>
                  ))}
                  {showFullSquad && remainingPlayers.map((p: any) => (
                    <li key={p.id} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.position ?? "—"}</div>
                    </li>
                  ))}
                </ul>
                {remainingPlayers.length > 0 && (
                  <button
                    onClick={() => setShowFullSquad(!showFullSquad)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
                  >
                    {showFullSquad ? (
                      <>
                        <ChevronUp size={16} />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        Show all {data.players.length} players
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </Section>

          <Section title={`Supporters (${fans.length})`}>
            {fans.length === 0 ? (
              <Empty>Be the first to support this team!</Empty>
            ) : (
              <>
                <ul className="space-y-1.5">
                  {initialSupporters.map((f) => (
                    <li key={f.id}>
                      <Link
                        to="/u/$id"
                        params={{ id: f.id }}
                        className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
                      >
                        <span className="font-medium">{f.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {f.country ?? ""} · joined {new Date(f.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {showFullSupporters && remainingSupporters.map((f) => (
                    <li key={f.id}>
                      <Link
                        to="/u/$id"
                        params={{ id: f.id }}
                        className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
                      >
                        <span className="font-medium">{f.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {f.country ?? ""} · joined {new Date(f.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {remainingSupporters.length > 0 && (
                  <button
                    onClick={() => setShowFullSupporters(!showFullSupporters)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
                  >
                    {showFullSupporters ? (
                      <>
                        <ChevronUp size={16} />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        Show all {fans.length} supporters
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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

function MatchLine({ m, teamId }: { m: any; teamId: number }) {
  const isHome = m.home_team_id === teamId;
  const opponent = isHome ? m.away_team_name : m.home_team_name;
  const opponentCrest = isHome ? m.away_team_crest : m.home_team_crest;
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        {opponentCrest && <img src={opponentCrest} alt="" className="h-6 w-6 object-contain" />}
        <div>
          <div className="font-medium">{isHome ? "vs" : "@"} {opponent ?? "TBD"}</div>
          <div className="text-xs text-muted-foreground">
            {m.utc_date ? new Date(m.utc_date).toLocaleString() : "TBD"} · {m.stage}
          </div>
        </div>
      </div>
      {m.home_score != null && (
        <div className="font-mono text-lg">
          {m.home_score}–{m.away_score}
        </div>
      )}
    </div>
  );
}