import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { FileText, Gauge, ArrowRight, Plus, MessageSquare } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, planLimits } from "@/hooks/useProfile";
import { useI18n, featureLabelKey, featureDescriptionKey } from "@/lib/i18n";
import { AI_FEATURE_LIST } from "@/lib/ai/features";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Tableau de bord — Lexia" },
      {
        name: "description",
        content:
          "Suivez vos crédits IA, vos documents analysés et lancez de nouvelles analyses depuis votre espace Lexia.",
      },
      { property: "og:title", content: "Tableau de bord — Lexia" },
      { property: "og:description", content: "Crédits, documents et analyses IA en un coup d'œil." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useProfile();
  const profile = data?.profile;
  const limits = planLimits(profile?.plan);
  const total = (profile?.credits ?? 0) + (profile?.credits_used ?? 0);
  const used = profile?.credits_used ?? 0;
  const { t } = useI18n();

  const documents = useQuery({
    queryKey: ["documents", "dashboard"],
    queryFn: async () => {
      const { data: docs, error } = await supabase
        .from("documents")
        .select("id, title, word_count, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return docs;
    },
  });

  const analyses = useQuery({
    queryKey: ["analyses", "dashboard"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("analyses")
        .select("id, kind, title, credits_cost, created_at, document_id")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return rows;
    },
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              {t("dashboard.greeting", { name: profile?.full_name?.split(" ")[0] ?? "" })} 👋
            </h1>
            <p className="mt-2 text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/documents">
                <Plus className="mr-1.5 size-4" /> {t("dashboard.newDocument")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/assistant">
                <MessageSquare className="mr-1.5 size-4" /> {t("dashboard.assistant")}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Gauge className="size-4" /> {t("dashboard.creditsLeft")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-display text-3xl font-bold">{profile?.credits ?? 0}</p>
              <Progress value={total ? ((total - used) / total) * 100 : 0} />
              <p className="text-xs text-muted-foreground">
                {t("dashboard.creditsConsumed", { credits: used })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="size-4" /> {t("dashboard.currentPlan")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-display text-3xl font-bold">{limits.label}</p>
              <Button asChild size="sm" variant="outline">
                <Link to="/pricing">
                  {t("dashboard.comparePlans")} <ArrowRight className="ml-1.5 size-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("dashboard.documents")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">
                {documents.data?.length ?? 0}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {limits.documents === Infinity ? `· ${t("dashboard.unlimited")}` : `/ ${limits.documents}`}
                </span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {limits.historyDays === Infinity
                  ? t("dashboard.historyRetention")
                  : t("dashboard.historyRetentionDays", { days: limits.historyDays })}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("dashboard.recentDocuments")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents.data?.length ? (
                documents.data.map((doc) => (
                  <Link
                    key={doc.id}
                    to="/documents/$id"
                    params={{ id: doc.id }}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="truncate">{doc.title}</span>
                    <span className="ml-3 shrink-0 font-mono text-xs text-muted-foreground">
                      {t("dashboard.words", { count: doc.word_count })}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="px-3 py-6 text-sm text-muted-foreground">
                  {t("dashboard.noDocuments")}{" "}
                  <Link to="/documents" className="text-primary hover:underline">
                    {t("dashboard.importOne")}
                  </Link>
                  .
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("dashboard.recentAnalyses")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analyses.data?.length ? (
                analyses.data.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="truncate">{item.title ?? t(featureLabelKey(item.kind))}</span>
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                      {t("credits.short", { credits: item.credits_cost })}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="px-3 py-6 text-sm text-muted-foreground">{t("dashboard.noAnalyses")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">{t("dashboard.availableAnalyses")}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {AI_FEATURE_LIST.map((feature) => (
              <Card key={feature.key} className="transition-transform hover:-translate-y-1">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-semibold">
                      {t(featureLabelKey(feature.key))}
                    </p>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {t("credits.short", { credits: feature.credits })}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(featureDescriptionKey(feature.key))}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
