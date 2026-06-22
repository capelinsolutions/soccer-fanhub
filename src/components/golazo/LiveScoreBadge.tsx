import { PulseDot } from "./PulseDot";
import type { ApiMatch } from "@/lib/football-types";
import { LIVE_STATUSES } from "@/lib/football-types";

export function LiveScoreBadge({ match }: { match: ApiMatch }) {
  const isLive = LIVE_STATUSES.includes(match.status);
  const isFinished = match.status === "FINISHED";
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-destructive">
        <PulseDot />
        {match.minute ? `${match.minute}'` : "Live"} · {match.homeScore ?? 0}–{match.awayScore ?? 0}
      </span>
    );
  }
  if (isFinished) {
    return (
      <span className="rounded-full bg-card px-2 py-1 font-mono text-[11px] font-semibold text-foreground">
        FT {match.homeScore}–{match.awayScore}
      </span>
    );
  }
  return (
    <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
      {new Date(match.utcDate).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}
    </span>
  );
}