import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Markdown } from "@/components/Markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { analyzeDocument } from "@/lib/ai.functions";
import { useI18n, featureLabelKey } from "@/lib/i18n";
import { AI_FEATURES, type AiFeatureKey } from "@/lib/ai/features";

const RUNNABLE: AiFeatureKey[] = ["summary", "extract", "qa", "risk", "actions", "finance", "report"];

export const Route = createFileRoute("/documents/$id")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Analyse de document — Lexia" },
      {
        name: "description",
        content:
          "Lancez résumé, extraction de données, analyse de risques ou rapport complet sur votre document avec l'IA Lexia.",
      },
      { property: "og:title", content: "Analyse de document — Lexia" },
      { property: "og:description", content: "Analyses IA et historique de votre document." },
    ],
  }),
  component: DocumentDetail,
});

function DocumentDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const runAnalysis = useServerFn(analyzeDocument);
  const { t } = useI18n();
  const [question, setQuestion] = useState("");
  const [active, setActive] = useState<string | null>(null);

  const doc = useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, content, word_count, summary, created_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const analyses = useQuery({
    queryKey: ["analyses", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, kind, title, prompt, result, model, credits_cost, created_at")
        .eq("document_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const run = useMutation({
    mutationFn: async (feature: AiFeatureKey) => {
      if (feature === "qa" && question.trim().length < 5) {
        throw new Error(t("documentDetail.questionTooShort"));
      }
      return runAnalysis({
        data: {
          documentId: id,
          feature: feature as "summary" | "extract" | "qa" | "risk" | "report" | "actions" | "finance",
          ...(feature === "qa" ? { question: question.trim() } : {}),
        },
      });
    },
    onMutate: (feature) => setActive(feature),
    onSuccess: (result) => {
      toast.success(t("documentDetail.analysisDone", { credits: result.credits }));
      queryClient.invalidateQueries({ queryKey: ["analyses", id] });
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message || t("documentDetail.analysisFailed")),
    onSettled: () => setActive(null),
  });

  if (doc.isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-64 w-full" />
      </AppShell>
    );
  }

  if (!doc.data) {
    return (
      <AppShell>
        <Card>
          <CardContent className="space-y-4 p-12 text-center">
            <p className="font-display text-lg font-semibold">{t("documentDetail.notFound")}</p>
            <Button asChild variant="outline">
              <Link to="/documents">{t("documentDetail.backToDocuments")}</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/documents">
              <ArrowLeft className="mr-1.5 size-4" /> {t("documentDetail.backToDocuments")}
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold">{doc.data.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              {t("dashboard.words", { count: doc.data.word_count })}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t("documents.importedOn", {
                date: new Date(doc.data.created_at).toLocaleDateString(),
              })}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("documentDetail.runAnalysis")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {RUNNABLE.map((key) => {
                const feature = AI_FEATURES[key];
                return (
                  <Button
                    key={key}
                    variant={feature.premium ? "default" : "outline"}
                    size="sm"
                    disabled={run.isPending}
                    onClick={() => run.mutate(key)}
                  >
                    {active === key ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 size-3.5" />
                    )}
                    {t(featureLabelKey(key))}
                    <span className="ml-1.5 font-mono text-xs opacity-70">
                      {feature.credits} cr.
                    </span>
                  </Button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("documentDetail.questionPlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !run.isPending) run.mutate("qa");
                }}
              />
              <Button variant="secondary" disabled={run.isPending} onClick={() => run.mutate("qa")}>
                {t("documentDetail.askQuestion")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="analyses">
          <TabsList>
            <TabsTrigger value="analyses">
              {t("documentDetail.analysesTab", { count: analyses.data?.length ?? 0 })}
            </TabsTrigger>
            <TabsTrigger value="content">{t("documentDetail.contentTab")}</TabsTrigger>
          </TabsList>
          <TabsContent value="analyses" className="space-y-4 pt-4">
            {analyses.data?.length ? (
              analyses.data.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base">
                        {item.title ?? t(featureLabelKey(item.kind))}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{t(featureLabelKey(item.kind))}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">
                          {t("credits.short", { credits: item.credits_cost })} ·{" "}
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.prompt && (
                      <p className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                        {item.prompt}
                      </p>
                    )}
                    <Markdown content={item.result ?? ""} />
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  {t("documentDetail.noAnalysisYet")}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="content" className="pt-4">
            <Card>
              <CardContent className="max-h-[60vh] overflow-auto whitespace-pre-wrap p-5 font-mono text-xs text-muted-foreground">
                {doc.data.content}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
