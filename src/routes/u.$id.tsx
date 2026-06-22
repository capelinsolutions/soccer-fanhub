import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/golazo/AppShell";
import { getProfileById } from "@/lib/community.functions";
import { getTeamDetail } from "@/lib/football-extras.functions";

export const Route = createFileRoute("/u/$id")({
  head: () => ({
    meta: [
      { title: "Fan profile — FIFA FAN HUB" },
      { name: "description", content: "Public fan profile on FIFA FAN HUB." },
    ],
  }),
  component: PublicProfile,
});

function PublicProfile() {
  const { id } = Route.useParams();
  const router = useRouter();
  const fetchProfile = useServerFn(getProfileById);
  const fetchTeam = useServerFn(getTeamDetail);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => fetchProfile({ data: { id } }),
  });

  const { data: teamDetail } = useQuery({
    queryKey: ["profile-team", profile?.favorite_team_id],
    queryFn: () => fetchTeam({ data: { teamId: profile!.favorite_team_id! } }),
    enabled: !!profile?.favorite_team_id,
  });

  if (isLoading) {
    return (
      <AppShell hideNav>
        <div className="grid min-h-screen place-items-center text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell hideNav>
        <div className="grid min-h-screen place-items-center px-6 text-center text-sm text-muted-foreground">
          Profile not found.
          <Link to="/leaderboards" className="ml-2 text-primary underline">
            Browse fans
          </Link>
        </div>
      </AppShell>
    );
  }

  const team = teamDetail?.team as { id: number; name: string } | undefined;

  return (
    <AppShell hideNav>
      <div className="min-h-screen pb-16">
        <div className="relative h-40 bg-gradient-to-br from-primary/30 to-background">
          <button
            onClick={() => router.history.back()}
            className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-background/80 backdrop-blur"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
        <div className="-mt-10 px-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h1 className="font-display text-4xl leading-none">{profile.display_name}</h1>
            <div className="mt-4 grid gap-2 text-sm">
              <Row label="Country" value={profile.country ?? "—"} />
              <Row
                label="Favorite team"
                value={
                  team ? (
                    <Link
                      to="/team/$id"
                      params={{ id: String(team.id) }}
                      className="text-primary underline"
                    >
                      {team.name}
                    </Link>
                  ) : profile.favorite_team_id ? (
                    "Loading…"
                  ) : (
                    "—"
                  )
                }
              />
              <Row
                label="Member since"
                value={new Date(profile.created_at).toLocaleDateString()}
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
