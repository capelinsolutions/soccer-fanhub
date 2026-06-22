import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { getWcTeams } from "@/lib/football-extras.functions";
import { wcCountries } from "@/lib/mock/countries";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — FIFA FAN HUB" },
      {
        name: "description",
        content: "Sign in or create your FIFA FAN HUB account.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { user, ready } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    if (ready && user) navigate({ to: "/" });
  }, [ready, user, navigate]);

  return (
    <div className="min-h-screen bg-background px-5 pb-16 pt-6">
      <div className="mx-auto max-w-md">
        <button
          onClick={() => router.history.back()}
          className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display text-4xl text-primary">FIFA FAN HUB</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Welcome back. Sign in to chat and join watch parties."
            : "Create your fan account. Pick your country and team."}
        </p>

        <div className="mt-6 flex rounded-full bg-card p-1 text-sm">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-full px-3 py-2 ${mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Sign in
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full px-3 py-2 ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Create account
          </button>
        </div>

        <div className="mt-6">
          {mode === "signin" ? <SignInForm /> : <SignUpForm />}
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input label="Email" type="email" value={email} onChange={setEmail} required />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        required
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {loading && <Loader2 size={14} className="animate-spin" />} Sign in
      </button>
    </form>
  );
}

function SignUpForm() {
  const fetchTeams = useServerFn(getWcTeams);
  const { data: teams = [] } = useQuery({
    queryKey: ["wc-teams"],
    queryFn: () => fetchTeams(),
    staleTime: 60 * 60 * 1000,
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [teamId, setTeamId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
          country,
          favorite_team_id: teamId,
        },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input label="Display name" value={displayName} onChange={setDisplayName} required />
      <Input label="Email" type="email" value={email} onChange={setEmail} required />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        required
        minLength={8}
      />
      <Select label="Country" value={country} onChange={setCountry} required>
        <option value="">Pick your country…</option>
        {wcCountries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name}
          </option>
        ))}
      </Select>
      <Select label="Supporting team" value={teamId} onChange={setTeamId} required>
        <option value="">Pick a team…</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {loading && <Loader2 size={14} className="animate-spin" />} Create account
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
      >
        {children}
      </select>
    </label>
  );
}