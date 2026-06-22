import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useScheduleAlerts } from "@/hooks/useScheduleQuery";

export function ScheduleAlertsBanner() {
  const { alerts, dismiss, dismissAll } = useScheduleAlerts();
  const [open, setOpen] = useState(false);
  if (alerts.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mx-5 mt-3 flex w-[calc(100%-2.5rem)] items-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-left text-xs text-yellow-200"
      >
        <AlertTriangle size={14} className="shrink-0" />
        <span className="flex-1">
          {alerts.length} schedule {alerts.length === 1 ? "update" : "updates"} — tap to view
        </span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-2xl bg-background p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl">Schedule updates</h3>
              <button
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-card text-foreground"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-border bg-card p-3 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="font-display text-base">{a.label}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                        {a.kind === "kickoff"
                          ? "Kickoff moved"
                          : a.kind === "venue"
                          ? "Venue changed"
                          : `Status: ${a.after}`}
                      </div>
                      <div className="mt-1 text-xs">
                        <span className="text-muted-foreground line-through">
                          {a.before}
                        </span>{" "}
                        → <span className="font-semibold">{a.after}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => dismiss(a.id)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                dismissAll();
                setOpen(false);
              }}
              className="mt-4 w-full rounded-full border border-border bg-card py-2 text-xs font-bold uppercase tracking-wider text-foreground"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </>
  );
}