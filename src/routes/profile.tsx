import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, Loader2, Save, KeyRound, Trophy } from "lucide-react";
import { AppShell } from "@/components/golazo/AppShell";
import { Header } from "@/components/golazo/Header";
import { useAuth } from "@/context/AuthContext";
import { wcCountries } from "@/lib/mock/countries";
import { supabase } from "@/integrations/supabase/client";
import { getWcTeams } from "@/lib/football-extras.functions";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — FIFA FAN HUB" },
      { name: "description", content: "Manage your FIFA FAN HUB profile, country and supporting team." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, ready, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/auth" });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <AppShell>
        <Header />
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header />
      <section className="px-5 pt-6">
        <h1 className="font-display text-4xl">PROFILE</h1>
        <div className="mt-3 rounded-2xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Signed in as
          </div>
          <div className="mt-0.5 font-semibold">{profile?.display_name ?? user.email}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/auth" });
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </section>

      {profile && (
        <ProfileForm
          profile={profile}
          onSaved={refreshProfile}
        />
      )}

      <PasswordForm />
    </AppShell>
  );
}

function ProfileForm({
  profile,
  onSaved,
}: {
  profile: NonNullable<ReturnType<typeof useAuth>["profile"]>;
  onSaved: () => Promise<void>;
}) {
  const fetchTeams = useServerFn(getWcTeams);
  const { data: teams = [] } = useQuery({
    queryKey: ["wc-teams"],
    queryFn: () => fetchTeams(),
    staleTime: 60 * 60 * 1000,
  });

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [country, setCountry] = useState(profile.country ?? "");
  const [teamId, setTeamId] = useState<string>(
    profile.favorite_team_id ? String(profile.favorite_team_id) : "",
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        country: country || null,
        favorite_team_id: teamId ? Number(teamId) : null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      setMsg({ kind: "err", text: error.message });
      return;
    }
    await onSaved();
    setMsg({ kind: "ok", text: "Profile updated." });
  };

  return (
    <section className="mt-5 px-5">
      <form
        onSubmit={submit}
        className="space-y-3 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="font-display text-xl">DETAILS</h2>
        <Field label="Display name">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={60}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Country">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">— None —</option>
            {wcCountries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Supporting team">
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">— None —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        {msg && (
          <p className={`text-sm ${msg.kind === "ok" ? "text-primary" : "text-destructive"}`}>
            {msg.text}
          </p>
        )}
        <button
          disabled={saving}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save changes
        </button>
      </form>
    </section>
  );
}

function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (password.length < 8) {
      setMsg({ kind: "err", text: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      setMsg({ kind: "err", text: "Passwords don't match." });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setMsg({ kind: "err", text: error.message });
      return;
    }
    setPassword("");
    setConfirm("");
    setMsg({ kind: "ok", text: "Password updated." });
  };

  return (
    <section className="mt-5 px-5 pb-8">
      <form
        onSubmit={submit}
        className="space-y-3 rounded-2xl border border-border bg-card p-5"
      >
        <h2 className="inline-flex items-center gap-2 font-display text-xl">
          <KeyRound size={16} /> CHANGE PASSWORD
        </h2>
        <Field label="New password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </Field>
        {msg && (
          <p className={`text-sm ${msg.kind === "ok" ? "text-primary" : "text-destructive"}`}>
            {msg.text}
          </p>
        )}
        <button
          disabled={saving || !password}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold disabled:opacity-60"
        >
          {saving && <Loader2 size={14} className="animate-spin" />} Update password
        </button>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
