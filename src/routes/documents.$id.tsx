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
import { AI_FEATURES, featureLabel, type AiFeatureKey } from "@/lib/ai/features";

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
        throw new Error("Posez une question d'au moins 5 caractères.");
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
      toast.success(`Analyse terminée (${result.credits} crédits)`);
      queryClient.invalidateQueries({ queryKey: ["analyses", id] });
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message || "L'analyse a échoué."),
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
            <p className="font-display text-lg font-semibold">Document introuvable</p>
            <Button asChild variant="outline">
              <Link to="/documents">Retour aux documents</Link>
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
              <ArrowLeft className="mr-1.5 size-4" /> Documents
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-bold">{doc.data.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              {doc.data.word_count} mots
            </Badge>
            <span className="text-xs text-muted-foreground">
              Importé le {new Date(doc.data.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lancer une analyse IA</CardTitle>
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
                    {feature.label}
                    <span className="ml-1.5 font-mono text-xs opacity-70">{feature.credits} cr.</span>
                  </Button>
                );
              })}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Posez une question sur ce document…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !run.isPending) run.mutate("qa");
                }}
              />
              <Button variant="secondary" disabled={run.isPending} onClick={() => run.mutate("qa")}>
                Interroger (1 cr.)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="analyses">
          <TabsList>
            <TabsTrigger value="analyses">Analyses ({analyses.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="content">Contenu</TabsTrigger>
          </TabsList>
          <TabsContent value="analyses" className="space-y-4 pt-4">
            {analyses.data?.length ? (
              analyses.data.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-base">{item.title ?? featureLabel(item.kind)}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{featureLabel(item.kind)}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">
                          {item.credits_cost} cr. · {new Date(item.created_at).toLocaleString("fr-FR")}
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
                  Aucune analyse encore. Choisissez une action ci-dessus.
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
