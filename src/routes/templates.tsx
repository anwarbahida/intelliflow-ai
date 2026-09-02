import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, featureLabelKey } from "@/lib/i18n";

export const Route = createFileRoute("/templates")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Modèles — Lexia" },
      {
        name: "description",
        content: "Explorez les modèles d'analyse IA et lancez-les en un clic.",
      },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const templates = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("id, title, description, category, kind, is_premium, usage_count")
        .eq("is_active", true)
        .order("usage_count", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const useTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await supabase
        .from("templates")
        .update({ usage_count: (templates.data?.find((t) => t.id === templateId)?.usage_count ?? 0) + 1 })
        .eq("id", templateId);
      return templateId;
    },
    onSuccess: (_data, templateId) => {
      const template = templates.data?.find((t) => t.id === templateId);
      if (template) {
        queryClient.invalidateQueries({ queryKey: ["templates"] });
        toast.success(t("templates.launched", { title: template.title }));
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (templates.isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("templates.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("templates.subtitle")}</p>
        </div>

        {templates.data?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("templates.empty")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.data?.map((tpl) => (
              <Card key={tpl.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{tpl.title}</CardTitle>
                    {tpl.is_premium && <Badge variant="default">Premium</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{tpl.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {tpl.category}
                      </Badge>
                      {tpl.kind && (
                        <Badge variant="outline" className="text-xs">
                          {t(featureLabelKey(tpl.kind))}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t("templates.usageCount", { count: tpl.usage_count })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => useTemplateMutation.mutate(tpl.id)}
                    disabled={useTemplateMutation.isPending}
                  >
                    {t("templates.use")}
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
