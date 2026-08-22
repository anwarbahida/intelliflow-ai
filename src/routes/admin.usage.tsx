import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Coins, Crown, CreditCard, TrendingUp, Trophy, Users } from "lucide-react";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProfile } from "@/hooks/useProfile";
import { adminGetUsageStats } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/usage")({
  ssr: false,
  component: AdminUsage,
});

function AdminUsage() {
  const { data: profileData } = useProfile();
  const { t } = useI18n();

  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminGetUsageStats(),
    enabled: Boolean(profileData?.isAdmin),
  });

  const usageLogs = statsQuery.data?.usageLogs ?? [];
  const userProfiles = statsQuery.data?.userProfiles ?? [];
  const planBreakdown = statsQuery.data?.planBreakdown;

  const profileMap = useMemo(
    () => new Map(userProfiles.map((p) => [p.id, p])),
    [userProfiles],
  );

  const topUsersByTokens = useMemo(() => {
    const map = new Map<string, { tokens: number; credits: number; requests: number }>();
    for (const log of usageLogs) {
      const prev = map.get(log.user_id) ?? { tokens: 0, credits: 0, requests: 0 };
      map.set(log.user_id, {
        tokens: prev.tokens + (log.tokens ?? 0),
        credits: prev.credits + (log.credits ?? 0),
        requests: prev.requests + 1,
      });
    }
    return [...map.entries()]
      .sort((a, b) => b[1].tokens - a[1].tokens)
      .slice(0, 10)
      .map(([userId, data]) => ({
        userId,
        name: profileMap.get(userId)?.full_name || profileMap.get(userId)?.email || userId.slice(0, 8) + "…",
        ...data,
      }));
  }, [usageLogs, profileMap]);

  const topUsersByCredits = useMemo(() => {
    const map = new Map<string, { tokens: number; credits: number; requests: number }>();
    for (const log of usageLogs) {
      const prev = map.get(log.user_id) ?? { tokens: 0, credits: 0, requests: 0 };
      map.set(log.user_id, {
        tokens: prev.tokens + (log.tokens ?? 0),
        credits: prev.credits + (log.credits ?? 0),
        requests: prev.requests + 1,
      });
    }
    return [...map.entries()]
      .sort((a, b) => b[1].credits - a[1].credits)
      .slice(0, 10)
      .map(([userId, data]) => ({
        userId,
        name: profileMap.get(userId)?.full_name || profileMap.get(userId)?.email || userId.slice(0, 8) + "…",
        ...data,
      }));
  }, [usageLogs, profileMap]);

  const featureStats = useMemo(() => {
    const map = new Map<string, { requests: number; tokens: number; credits: number }>();
    for (const log of usageLogs) {
      const f = log.feature ?? "unknown";
      const prev = map.get(f) ?? { requests: 0, tokens: 0, credits: 0 };
      map.set(f, {
        requests: prev.requests + 1,
        tokens: prev.tokens + (log.tokens ?? 0),
        credits: prev.credits + (log.credits ?? 0),
      });
    }
    return [...map.entries()]
      .sort((a, b) => b[1].requests - a[1].requests);
  }, [usageLogs]);

  const dailyUsage = useMemo(() => {
    const map = new Map<string, { requests: number; tokens: number; credits: number }>();
    for (const log of usageLogs) {
      const day = log.created_at.slice(0, 10);
      const prev = map.get(day) ?? { requests: 0, tokens: 0, credits: 0 };
      map.set(day, {
        requests: prev.requests + 1,
        tokens: prev.tokens + (log.tokens ?? 0),
        credits: prev.credits + (log.credits ?? 0),
      });
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14);
  }, [usageLogs]);

  const maxTokens = featureStats.length > 0 ? Math.max(...featureStats.map(([, d]) => d.tokens), 1) : 1;
  const maxDailyTokens = dailyUsage.length > 0 ? Math.max(...dailyUsage.map(([, d]) => d.tokens), 1) : 1;

  const totalTokens = usageLogs.reduce((s, l) => s + (l.tokens ?? 0), 0);
  const totalCredits = usageLogs.reduce((s, l) => s + (l.credits ?? 0), 0);
  const totalRequests = usageLogs.length;

  const barColors = [
    "bg-primary",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("admin.tabUsage")}</h1>
        <p className="mt-2 text-muted-foreground">{t("admin.subtitle")}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CreditCard className="size-4" /> {t("admin.aiRequests")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{totalRequests}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" /> {t("admin.totalTokens")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{totalTokens.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Coins className="size-4" /> {t("admin.creditsConsumed")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{totalCredits.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="size-4" /> {t("admin.activeUsers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{topUsersByTokens.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="size-5 text-amber-500" /> {t("admin.topByTokens")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topUsersByTokens.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.noData")}</p>
            ) : (
              <div className="space-y-3">
                {topUsersByTokens.map((user, i) => (
                  <div key={user.userId} className="flex items-center gap-3">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-amber-500/15 text-amber-600" :
                      i === 1 ? "bg-gray-400/15 text-gray-500" :
                      i === 2 ? "bg-orange-500/15 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.requests} {t("admin.requests")} · {user.credits} {t("admin.credits")}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold">{user.tokens.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="size-5 text-purple-500" /> {t("admin.topByCredits")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topUsersByCredits.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.noData")}</p>
            ) : (
              <div className="space-y-3">
                {topUsersByCredits.map((user, i) => (
                  <div key={user.userId} className="flex items-center gap-3">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-amber-500/15 text-amber-600" :
                      i === 1 ? "bg-gray-400/15 text-gray-500" :
                      i === 2 ? "bg-orange-500/15 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.requests} {t("admin.requests")} · {user.tokens.toLocaleString()} tokens
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold">{user.credits}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("admin.featureUsage")}</CardTitle>
        </CardHeader>
        <CardContent>
          {featureStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.noData")}</p>
          ) : (
            <div className="space-y-4">
              {featureStats.map(([feature, data], i) => (
                <div key={feature} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{feature}</span>
                    <span className="text-muted-foreground">
                      {data.requests} {t("admin.requests")} · {data.tokens.toLocaleString()} tokens · {data.credits} {t("admin.credits")}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${barColors[i % barColors.length]}`}
                      style={{ width: `${(data.tokens / maxTokens) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {dailyUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.dailyUsage")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48">
              {dailyUsage.map(([day, data]) => (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {data.tokens.toLocaleString()}
                  </span>
                  <div
                    className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary"
                    style={{ height: `${(data.tokens / maxDailyTokens) * 100}%`, minHeight: 4 }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {day.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {planBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.planDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-6 h-32">
              {Object.entries(planBreakdown).map(([plan, count]) => {
                const maxPlan = Math.max(...Object.values(planBreakdown), 1);
                const colors: Record<string, string> = {
                  free: "bg-gray-400",
                  pro: "bg-blue-500",
                  business: "bg-emerald-500",
                  enterprise: "bg-purple-500",
                };
                return (
                  <div key={plan} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-sm font-bold">{count}</span>
                    <div
                      className={`w-full rounded-t ${colors[plan] ?? "bg-primary"}`}
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
          <CardTitle className="text-lg">{t("admin.featureUsage")}</CardTitle>
        </CardHeader>
        <CardContent>
          {featureStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.noData")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.feature")}</TableHead>
                  <TableHead className="text-right">{t("admin.requests")}</TableHead>
                  <TableHead className="text-right">{t("admin.totalTokens")}</TableHead>
                  <TableHead className="text-right">{t("admin.credits")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureStats.map(([feature, data]) => (
                  <TableRow key={feature}>
                    <TableCell className="font-medium">{feature}</TableCell>
                    <TableCell className="text-right">{data.requests}</TableCell>
                    <TableCell className="text-right">{data.tokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{data.credits}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
