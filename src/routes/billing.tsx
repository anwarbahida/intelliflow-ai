import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Gift, Zap } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/billing")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Facturation — Lexia" },
      {
        name: "description",
        content: "Consultez votre historique de transactions et de crédits.",
      },
    ],
  }),
  component: BillingPage,
});

const TYPE_ICONS: Record<string, typeof Zap> = {
  plan: Zap,
  purchase: Gift,
  usage: ArrowDownRight,
  admin_grant: ArrowUpRight,
};

const TYPE_COLORS: Record<string, string> = {
  plan: "bg-blue-500/10 text-blue-600",
  purchase: "bg-green-500/10 text-green-600",
  usage: "bg-orange-500/10 text-orange-600",
  admin_grant: "bg-purple-500/10 text-purple-600",
};

function BillingPage() {
  const { t } = useI18n();

  const transactions = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("id, amount, type, description, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (transactions.isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </AppShell>
    );
  }

  const totalCredits = transactions.data?.reduce((sum, tx) => sum + tx.amount, 0) ?? 0;
  const totalUsed = transactions.data?.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0) ?? 0;

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("billing.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("billing.subtitle")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{t("billing.totalCredits")}</p>
              <p className="text-2xl font-bold">{totalCredits.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{t("billing.totalUsed")}</p>
              <p className="text-2xl font-bold">{totalUsed.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{t("billing.totalTransactions")}</p>
              <p className="text-2xl font-bold">{transactions.data?.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("billing.history")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!transactions.data?.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("billing.empty")}
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.data.map((tx) => {
                  const Icon = TYPE_ICONS[tx.type] ?? Zap;
                  const colorClass = TYPE_COLORS[tx.type] ?? "bg-muted text-muted-foreground";
                  return (
                    <div key={tx.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={tx.amount >= 0 ? "default" : "destructive"}
                        className="shrink-0 font-mono text-xs"
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {tx.amount.toLocaleString()} cr.
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
