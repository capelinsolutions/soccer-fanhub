import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { AppShell } from "@/components/golazo/AppShell";
import { PulseDot } from "@/components/golazo/PulseDot";
import { getMatch, type Match } from "@/lib/mock/matches";
import { getMatchById } from "@/lib/football.functions";
import { flagFor, LIVE_STATUSES } from "@/lib/football-types";

export const Route = createFileRoute("/match/$id")({
  head: ({ params }) => {
    const m = getMatch(params.id);
    const title = m ? `${m.home.name} vs ${m.away.name} — FIFA FAN HUB` : "Match — FIFA FAN HUB";
    return {
      meta: [
        { title },
        { name: "description", content: "Live match details and score." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Live World Cup 2026 match." },
      ],
    };
  },
  component: MatchRoom,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center text-muted-foreground">
      Match not found.
    </div>
  ),
  loader: async ({ params }) => {
    const mock = getMatch(params.id);
    if (mock) return mock;
    const api = await getMatchById({ data: { id: params.id } });
    if (!api) throw notFound();
    const status: Match["status"] = LIVE_STATUSES.includes(api.status)
      ? "LIVE"
      : api.status === "FINISHED"
        ? "FT"
        : "UPCOMING";
    const synth: Match = {
      id: api.id,
      home: { name: api.home.name, code: api.home.code, flag: flagFor(api.home.code) },
      away: { name: api.away.name, code: api.away.code, flag: flagFor(api.away.code) },
      status,
      minute: api.minute ?? undefined,
      homeScore: api.homeScore ?? undefined,
      awayScore: api.awayScore ?? undefined,
      kickoff: new Date(api.utcDate).toLocaleString(),
      fansInRoom: 0,
    };
    return synth;
  },
});

function MatchRoom() {
  const match = Route.useLoaderData();
  const [scoreHome, setScoreHome] = useState<number>(match.homeScore ?? 0);
  const [scoreAway, setScoreAway] = useState<number>(match.awayScore ?? 0);

  const fetchById = useServerFn(getMatchById);
  const isApiId = /^\d+$/.test(match.id);
  const live = useQuery({
    queryKey: ["match-live", match.id],
    queryFn: () => fetchById({ data: { id: match.id } }),
    enabled: isApiId,
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 60_000;
      return LIVE_STATUSES.includes(d.status) ? 30_000 : 5 * 60_000;
    },
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    if (!live.data) return;
    if (typeof live.data.homeScore === "number") setScoreHome(live.data.homeScore);
    if (typeof live.data.awayScore === "number") setScoreAway(live.data.awayScore);
  }, [live.data]);

  const liveMinute = live.data?.minute ?? match.minute;
  const liveStatus = live.data?.status ?? match.status;
  const isLive =
    (liveStatus ? LIVE_STATUSES.includes(liveStatus) : false) ||
    match.status === "LIVE";
  const isFinal = liveStatus === "FINISHED" || match.status === "FT";

  return (
    <AppShell hideNav>
      <div className="min-h-screen pb-12">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <Link to="/" className="grid h-9 w-9 place-items-center rounded-full bg-card">
            <ArrowLeft size={18} />
          </Link>
          <div className="font-display text-lg">MATCH</div>
          {isLive && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-destructive">
              <PulseDot /> Live
            </span>
          )}
        </header>

        <section className="px-5 pt-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="grid grid-cols-3 items-center gap-3 text-center">
              <Side flag={match.home.flag} name={match.home.name} />
              <div>
                <div className="font-mono text-4xl tabular-nums">
                  {scoreHome}<span className="mx-2 text-muted-foreground">–</span>{scoreAway}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {isLive ? `${liveMinute ?? "—"}'` : isFinal ? "Full time" : "Kickoff"}
                </div>
              </div>
              <Side flag={match.away.flag} name={match.away.name} />
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <Row icon={<Calendar size={14} />} label="Kickoff" value={match.kickoff} />
            <Row icon={<MapPin size={14} />} label="Status" value={liveStatus} />
          </div>

          <Link
            to="/schedule"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold"
          >
            Back to schedule
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

function Side({ flag, name }: { flag: string; name: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-4xl">{flag}</span>
      <span className="mt-2 text-sm font-semibold">{name}</span>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
      <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
