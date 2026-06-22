import { Link } from "@tanstack/react-router";
import type { ApiMatch } from "@/lib/football-types";
import { flagFor } from "@/lib/football-types";
import { LiveScoreBadge } from "./LiveScoreBadge";

function Crest({ m }: { m: ApiMatch["home"] }) {
  if (m.crest) {
    return <img src={m.crest} alt="" className="h-5 w-5 object-contain" />;
  }
  return <span className="text-lg leading-none">{flagFor(m.code)}</span>;
}

export function MatchRow({ match }: { match: ApiMatch }) {
  return (
    <Link
      to="/match/$id"
      params={{ id: match.id }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 truncate">
          <Crest m={match.home} />
          <span className="truncate font-display text-sm">{match.home.name}</span>
          {match.homeScore !== null && (
            <span className="ml-auto font-mono text-sm">{match.homeScore}</span>
          )}
        </div>
        <div className="flex items-center gap-2 truncate">
          <Crest m={match.away} />
          <span className="truncate font-display text-sm">{match.away.name}</span>
          {match.awayScore !== null && (
            <span className="ml-auto font-mono text-sm">{match.awayScore}</span>
          )}
        </div>
      </div>
      <div className="ml-3 flex shrink-0 flex-col items-end gap-1">
        <LiveScoreBadge match={match} />
        {match.venue && (
          <span className="text-[10px] text-muted-foreground">{match.venue}</span>
        )}
      </div>
    </Link>
  );
}