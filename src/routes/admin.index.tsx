import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Coins, FileText, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { adminGetUsageStats } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  component: AdminOverview,
});

function AdminOverview() {
  const { data: profileData } = useProfile();
  const { t } = useI18n();

  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminGetUsageStats(),
    enabled: Boolean(profileData?.isAdmin),
  });

  const planBreakdown = statsQuery.data?.planBreakdown;
  const totalDocuments = statsQuery.data?.totalDocuments ?? 0;
  const usageLogs = statsQuery.data?.usageLogs ?? [];
  const creditTransactions = statsQuery.data?.creditTransactions ?? [];
  const userProfiles = statsQuery.data?.userProfiles ?? [];
  const totalTokens = usageLogs.reduce((s, l) => s + (l.tokens ?? 0), 0);
  const totalCreditsUsed = usageLogs.reduce((s, l) => s + (l.credits ?? 0), 0);
  const totalUsers = userProfiles.length;

  const featureStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of usageLogs) {
      map.set(log.feature ?? "unknown", (map.get(log.feature ?? "unknown") ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [usageLogs]);

  const dailyActivity = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of usageLogs) {
      const day = log.created_at.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  }, [usageLogs]);

  const creditByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of creditTransactions) {
      map.set(tx.type, (map.get(tx.type) ?? 0) + Math.abs(tx.amount));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [creditTransactions]);

  const maxDaily = dailyActivity.length > 0 ? Math.max(...dailyActivity.map(([, v]) => v), 1) : 1;
  const maxFeature = featureStats.length > 0 ? Math.max(...featureStats.map(([, v]) => v), 1) : 1;
  const maxCreditType = creditByType.length > 0 ? Math.max(...creditByType.map(([, v]) => v), 1) : 1;

  const barColors = ["bg-primary", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];
  const planColors: Record<string, string> = { free: "bg-gray-400", pro: "bg-blue-500", business: "bg-emerald-500", enterprise: "bg-purple-500" };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("admin.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("admin.subtitle")}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="size-4" /> {t("admin.totalUsers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{totalUsers}</p>
            {planBreakdown && (
              <p className="mt-1 text-xs text-muted-foreground">
                {planBreakdown.free} Free · {planBreakdown.pro} Pro · {planBreakdown.business} Business · {planBreakdown.enterprise} Enterprise
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="size-4" /> {t("admin.aiRequests")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{usageLogs.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Set(usageLogs.map((l) => l.user_id)).size} {t("admin.activeUsers")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Coins className="size-4" /> {t("admin.creditsConsumed")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{totalCreditsUsed.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalTokens.toLocaleString()} tokens
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="size-4" /> {t("admin.totalDocuments")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{totalDocuments}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {planBreakdown && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("admin.planDistribution")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 h-40">
                {Object.entries(planBreakdown).map(([plan, count]) => {
                  const maxPlan = Math.max(...Object.values(planBreakdown), 1);
                  return (
                    <div key={plan} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-sm font-bold">{count}</span>
                      <div
                        className={`w-full rounded-t ${planColors[plan] ?? "bg-primary"}`}
                        style={{ height: `${(count / maxPlan) * 100}%`, minHeight: 4 }}
                      />
                      <span className="text-xs capitalize text-muted-foreground">{plan}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.dailyActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.noData")}</p>
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {dailyActivity.map(([day, count]) => (
                  <div key={day} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-mono">{count}</span>
                    <div
                      className="w-full rounded-t bg-primary/80 hover:bg-primary transition-all"
                      style={{ height: `${(count / maxDaily) * 100}%`, minHeight: 4 }}
                    />
                    <span className="text-[10px] text-muted-foreground">{day.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.featureUsage")}</CardTitle>
          </CardHeader>
          <CardContent>
            {featureStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.noData")}</p>
            ) : (
              <div className="space-y-3">
                {featureStats.map(([feature, count], i) => (
                  <div key={feature} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{feature}</span>
                      <span className="text-muted-foreground">{count} {t("admin.requests")}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${barColors[i % barColors.length]}`}
                        style={{ width: `${(count / maxFeature) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.creditsByType")}</CardTitle>
          </CardHeader>
          <CardContent>
            {creditByType.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.noData")}</p>
            ) : (
              <div className="space-y-3">
                {creditByType.map(([type, amount], i) => (
                  <div key={type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{type}</span>
                      <span className="text-muted-foreground">{amount.toLocaleString()} {t("admin.credits")}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${barColors[i % barColors.length]}`}
                        style={{ width: `${(amount / maxCreditType) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
