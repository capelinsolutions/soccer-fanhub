import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background text-foreground">
      <main className={`flex-1 ${hideNav ? "" : "pb-20"}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}