import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getSchedule } from "@/lib/football.functions";
import type { ApiMatch, ScheduleResult } from "@/lib/football-types";
import { LIVE_STATUSES } from "@/lib/football-types";

const KEY = "golazo.schedule.snapshot.v1";

export type ScheduleAlert = {
  id: string;
  matchId: string;
  label: string; // "Brazil vs Argentina"
  kind: "kickoff" | "venue" | "status";
  before: string;
  after: string;
  ts: number;
};

type Snapshot = Record<string, { utcDate: string; venue: string | null; status: string }>;

function diff(prev: Snapshot, next: ApiMatch[]): ScheduleAlert[] {
  const alerts: ScheduleAlert[] = [];
  const ts = Date.now();
  for (const m of next) {
    const before = prev[m.id];
    if (!before) continue;
    const label = `${m.home.name} vs ${m.away.name}`;
    if (before.utcDate !== m.utcDate) {
      alerts.push({
        id: `${m.id}-kickoff-${m.utcDate}`,
        matchId: m.id,
        label,
        kind: "kickoff",
        before: new Date(before.utcDate).toLocaleString(),
        after: new Date(m.utcDate).toLocaleString(),
        ts,
      });
    }
    if ((before.venue ?? "") !== (m.venue ?? "")) {
      alerts.push({
        id: `${m.id}-venue-${m.venue ?? ""}`,
        matchId: m.id,
        label,
        kind: "venue",
        before: before.venue ?? "—",
        after: m.venue ?? "—",
        ts,
      });
    }
    if (
      ["POSTPONED", "CANCELLED", "SUSPENDED"].includes(m.status) &&
      before.status !== m.status
    ) {
      alerts.push({
        id: `${m.id}-status-${m.status}`,
        matchId: m.id,
        label,
        kind: "status",
        before: before.status,
        after: m.status,
        ts,
      });
    }
  }
  return alerts;
}

const ALERTS_KEY = "golazo.schedule.alerts.v1";

function loadAlerts(): ScheduleAlert[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(ALERTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveAlerts(a: ScheduleAlert[]) {
  try {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(a.slice(0, 50)));
  } catch {}
}

function loadSnapshot(): Snapshot {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}
function saveSnapshot(matches: ApiMatch[]) {
  const snap: Snapshot = {};
  for (const m of matches) {
    snap[m.id] = { utcDate: m.utcDate, venue: m.venue, status: m.status };
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(snap));
  } catch {}
}

export function useScheduleQuery() {
  const fn = useServerFn(getSchedule);
  const qc = useQueryClient();
  const q = useQuery<ScheduleResult>({
    queryKey: ["schedule"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasLive = data.matches.some((m) => LIVE_STATUSES.includes(m.status));
      return hasLive ? 30_000 : 5 * 60_000;
    },
  });

  // Detect changes on each successful fetch
  useEffect(() => {
    if (!q.data || q.data.source !== "live") return;
    const prev = loadSnapshot();
    if (Object.keys(prev).length > 0) {
      const newAlerts = diff(prev, q.data.matches);
      if (newAlerts.length > 0) {
        const existing = loadAlerts();
        const seenIds = new Set(existing.map((a) => a.id));
        const merged = [
          ...newAlerts.filter((a) => !seenIds.has(a.id)),
          ...existing,
        ];
        saveAlerts(merged);
        qc.setQueryData(["schedule-alerts"], merged);
      }
    }
    saveSnapshot(q.data.matches);
  }, [q.data, qc]);

  return q;
}

export function useScheduleAlerts() {
  const qc = useQueryClient();
  const q = useQuery<ScheduleAlert[]>({
    queryKey: ["schedule-alerts"],
    queryFn: () => loadAlerts(),
    staleTime: Infinity,
  });
  const dismiss = (id: string) => {
    const next = (q.data ?? []).filter((a) => a.id !== id);
    saveAlerts(next);
    qc.setQueryData(["schedule-alerts"], next);
  };
  const dismissAll = () => {
    saveAlerts([]);
    qc.setQueryData(["schedule-alerts"], []);
  };
  return { alerts: q.data ?? [], dismiss, dismissAll };
}