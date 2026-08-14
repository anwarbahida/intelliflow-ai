import { Link, useLocation } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Logo, ThemeToggle } from "@/components/site/SiteChrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile, planLimits } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Tableau de bord", to: "/dashboard" },
  { label: "Documents", to: "/documents" },
  { label: "Assistant", to: "/assistant" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data } = useProfile();
  const profile = data?.profile;
  const limits = planLimits(profile?.plan);
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Logo />
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground",
                    pathname.startsWith(item.to) ? "bg-muted text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              {profile?.credits ?? 0} crédits
            </Badge>
            <Badge className="hidden sm:inline-flex">{limits.label}</Badge>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              Déconnexion
            </Button>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm",
                pathname.startsWith(item.to) ? "bg-muted text-foreground" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
