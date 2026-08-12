import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Sparkles, FileText, Gauge, ArrowRight } from "lucide-react";

import { Logo, ThemeToggle } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, planLimits } from "@/hooks/useProfile";
import { AI_FEATURE_LIST } from "@/lib/ai/features";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  component: Dashboard,
});

function Dashboard() {
  const { data } = useProfile();
  const profile = data?.profile;
  const limits = planLimits(profile?.plan);
  const total = (profile?.credits ?? 0) + (profile?.credits_used ?? 0);
  const used = profile?.credits_used ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              {profile?.credits ?? 0} crédits
            </Badge>
            <Badge>{limits.label}</Badge>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Bonjour {profile?.full_name?.split(" ")[0] ?? ""} 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Lancez une analyse IA ou consultez votre consommation de crédits.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Gauge className="size-4" /> Crédits restants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-display text-3xl font-bold">{profile?.credits ?? 0}</p>
              <Progress value={total ? ((total - used) / total) * 100 : 0} />
              <p className="text-xs text-muted-foreground">{used} crédits consommés au total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="size-4" /> Plan actuel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-display text-3xl font-bold">{limits.label}</p>
              <Button asChild size="sm" variant="outline">
                <Link to="/pricing">
                  Comparer les plans <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">
                {limits.documents === Infinity ? "Illimités" : `${limits.documents} max`}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Historique conservé{" "}
                {limits.historyDays === Infinity ? "sans limite" : `${limits.historyDays} jours`}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Analyses disponibles</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {AI_FEATURE_LIST.map((feature) => (
              <Card key={feature.key} className="transition-transform hover:-translate-y-1">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-semibold">{feature.label}</p>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {feature.credits} cr.
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
