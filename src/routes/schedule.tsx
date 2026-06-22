import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/golazo/AppShell";
import { Header } from "@/components/golazo/Header";
import { MatchRow } from "@/components/golazo/MatchRow";
import { ScheduleAlertsBanner } from "@/components/golazo/ScheduleAlertsBanner";
import { useScheduleQuery } from "@/hooks/useScheduleQuery";
import { useAuth } from "@/context/AuthContext";
import { LIVE_STATUSES, type ApiMatch } from "@/lib/football-types";
import { Loader2, RefreshCw } from "lucide-react";

type Tab = "all" | "live" | "today" | "mine";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Schedule — FIFA FAN HUB" },
      {
        name: "description",
        content: "Full FIFA World Cup 2026 schedule with live scores and kickoff updates.",
      },
      { property: "og:title", content: "World Cup 2026 Schedule — FIFA FAN HUB" },
      {
        property: "og:description",
        content: "Every match, live scores, and schedule changes in one place.",
      },
    ],
  }),
  component: SchedulePage,
});

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function SchedulePage() {
  const q = useScheduleQuery();
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("all");

  const matches = q.data?.matches ?? [];
  const myCodes = useMemo(() => {
    const c = profile?.country?.trim().toUpperCase();
    return new Set(c ? [c] : []);
  }, [profile]);

  const filtered = useMemo(() => {
    const today = new Date();
    return matches
      .filter((m) => {
        if (tab === "live") return LIVE_STATUSES.includes(m.status);
        if (tab === "today") return sameDay(new Date(m.utcDate), today);
        if (tab === "mine")
          return (
            myCodes.has(m.home.code.toUpperCase()) ||
            myCodes.has(m.away.code.toUpperCase())
          );
        return true;
      })
      .sort(
        (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
      );
  }, [matches, tab, myCodes]);

  const grouped = useMemo(() => {
    const map = new Map<string, ApiMatch[]>();
    for (const m of filtered) {
      const d = new Date(m.utcDate);
      const key = d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "live", label: "Live" },
    { id: "today", label: "Today" },
    { id: "mine", label: "My Teams" },
  ];

  return (
    <AppShell>
      <Header />
      <ScheduleAlertsBanner />
      <section className="px-5 pt-5">
        <div className="flex items-end justify-between">
          <h1 className="font-display text-4xl leading-none">SCHEDULE</h1>
          <button
            onClick={() => q.refetch()}
            className="grid h-9 w-9 place-items-center rounded-full bg-card text-foreground"
            aria-label="Refresh"
          >
            {q.isFetching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
          </button>
        </div>
        {q.data?.source === "mock" && (
          <p className="mt-2 text-[11px] text-yellow-300/80">
            {q.data.reason === "NO_KEY"
              ? "Live data not connected — showing demo fixtures."
              : q.data.reason === "RATE_LIMIT"
              ? "Rate-limited by data provider — showing cached demo data."
              : "Live data unavailable — showing demo fixtures."}
          </p>
        )}

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => {
            const disabled = t.id === "mine" && myCodes.size === 0;
            return (
              <button
                key={t.id}
                onClick={() => !disabled && setTab(t.id)}
                disabled={disabled}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground"
                } ${disabled ? "opacity-40" : ""}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-5 px-5">
        {q.isLoading ? (
          <div className="grid place-items-center py-12 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            {tab === "mine"
              ? "No matches for your selected teams."
              : "No matches found."}
          </p>
        ) : (
          grouped.map(([day, dayMatches]) => (
            <div key={day} className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                  {day}
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                {dayMatches.map((m) => (
                  <MatchRow key={m.id} match={m} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <div className="px-5 pb-6 text-center">
        <Link
          to="/"
          className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Back to home
        </Link>
      </div>
    </AppShell>
  );
}