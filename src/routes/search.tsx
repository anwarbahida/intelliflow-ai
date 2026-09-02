import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Markdown } from "@/components/Markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { smartSearch } from "@/lib/ai.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/search")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Recherche intelligente — Lexia" },
      {
        name: "description",
        content:
          "Recherchez dans tous vos documents avec le moteur sémantique Lexia.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const sendSearch = useServerFn(smartSearch);

  const search = useMutation({
    mutationFn: (q: string) => sendSearch({ data: { query: q } }),
    onSuccess: () => {},
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("search.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("search.subtitle")}</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (query.trim().length < 2) return;
                search.mutate(query.trim());
              }}
              className="flex gap-2"
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="flex-1"
              />
              <Button type="submit" disabled={search.isPending || query.trim().length < 2}>
                {search.isPending ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <SearchIcon className="mr-1.5 size-4" />
                )}
                {t("search.button")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {search.isPending && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("search.loading")}
            </CardContent>
          </Card>
        )}

        {search.data && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("search.resultTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {search.data.credits > 0 && (
                <p className="mb-3 text-xs text-muted-foreground">
                  {t("search.creditsUsed", { credits: search.data.credits })}
                </p>
              )}
              <Markdown content={search.data.text} />
            </CardContent>
          </Card>
        )}

        {search.isError && !search.isPending && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-destructive">
              {search.error?.message || t("search.error")}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
