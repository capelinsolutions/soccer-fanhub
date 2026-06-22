import { BarChart3, CalendarDays, LogIn, Trophy, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user: authUser } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
      <Link to="/" className="font-display text-3xl leading-none text-primary">
        FIFA FAN HUB
      </Link>
      <div className="flex items-center gap-3">
        <Link
          to="/schedule"
          className="grid h-9 w-9 place-items-center rounded-full bg-card text-foreground transition-colors hover:bg-accent"
          aria-label="Schedule"
        >
          <CalendarDays size={18} />
        </Link>
        <Link
          to="/teams"
          className="grid h-9 w-9 place-items-center rounded-full bg-card text-foreground transition-colors hover:bg-accent"
          aria-label="Teams"
        >
          <Trophy size={18} />
        </Link>
        <Link
          to="/standings"
          className="grid h-9 w-9 place-items-center rounded-full bg-card text-foreground transition-colors hover:bg-accent"
          aria-label="Standings"
        >
          <BarChart3 size={18} />
        </Link>
        {authUser ? (
          <Link
            to="/profile"
            className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-card text-foreground ring-1 ring-border transition-colors hover:bg-accent"
            aria-label="Profile"
          >
            <User size={18} />
          </Link>
        ) : (
          <Link
            to="/auth"
            className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition-colors"
            aria-label="Sign in"
          >
            <LogIn size={16} />
          </Link>
        )}
      </div>
    </header>
  );
}
