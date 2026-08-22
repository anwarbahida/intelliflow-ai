import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Activity, BarChart3, Coins, Eye, Filter, Plus, ShieldCheck, Trash2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile } from "@/hooks/useProfile";
import { adminAddCredits, adminDeleteUser, adminGetActivity, adminListUsers } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/activity")({
  ssr: false,
  component: AdminActivity,
});

function AdminActivity() {
  const { data: profileData } = useProfile();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [creditsDialog, setCreditsDialog] = useState<{ userId: string; userName: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState(50);
  const [creditReason, setCreditReason] = useState("");
  const addCreditsFn = useServerFn(adminAddCredits);

  const [detailsDialog, setDetailsDialog] = useState<{
    user: { id: string; full_name: string | null; email: string | null; plan: string | null; credits: number | null; credits_used: number | null; created_at: string | null };
    role: string;
  } | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{ userId: string; userName: string } | null>(null);
  const deleteUserFn = useServerFn(adminDeleteUser);

  const activityQuery = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: () => adminGetActivity(),
    enabled: Boolean(profileData?.isAdmin),
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminListUsers(),
    enabled: Boolean(profileData?.isAdmin),
  });

  const addCredits = useMutation({
    mutationFn: addCreditsFn,
    onSuccess: () => {
      toast.success(t("admin.creditsAdded"));
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setCreditsDialog(null);
      setCreditAmount(50);
      setCreditReason("");
    },
    onError: (e: Error) => toast.error(e.message || t("admin.error")),
  });

  const deleteUser = useMutation({
    mutationFn: deleteUserFn,
    onSuccess: () => {
      toast.success(t("admin.userDeleted"));
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setDeleteDialog(null);
    },
    onError: (e: Error) => toast.error(e.message || t("admin.error")),
  });

  const recentLogs = activityQuery.data?.logs ?? [];
  const users = usersQuery.data?.users ?? [];
  const roles = usersQuery.data?.roles ?? [];
  const roleFor = (userId: string) => roles.find((r) => r.user_id === userId)?.role ?? "user";

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const actionTypes = useMemo(() => [...new Set(recentLogs.map((l) => l.action))], [recentLogs]);

  const filteredLogs = recentLogs.filter((log) => {
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const user = log.user_id ? userMap.get(log.user_id) : undefined;
    const matchesSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user_id?.toLowerCase().includes(search.toLowerCase()) ||
      user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user?.email?.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const actionStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of recentLogs) {
      map.set(log.action, (map.get(log.action) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [recentLogs]);

  const dailyActivity = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of recentLogs) {
      const day = log.created_at.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  }, [recentLogs]);

  const mostActiveUser = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of recentLogs) {
      if (log.user_id) map.set(log.user_id, (map.get(log.user_id) ?? 0) + 1);
    }
    let top: { userId: string; count: number; name: string } | null = null;
    for (const [userId, count] of map) {
      if (!top || count > top.count) {
        const user = userMap.get(userId);
        top = { userId, count, name: user?.full_name || user?.email || userId.slice(0, 8) + "…" };
      }
    }
    return top;
  }, [recentLogs, userMap]);

  const maxActionCount = actionStats.length > 0 ? Math.max(...actionStats.map(([, v]) => v), 1) : 1;
  const maxDaily = dailyActivity.length > 0 ? Math.max(...dailyActivity.map(([, v]) => v), 1) : 1;

  const barColors = ["bg-primary", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-rose-500"];

  function getActionIcon(action: string) {
    if (action.includes("credit") || action.includes("grant")) return <Coins className="size-4" />;
    if (action.includes("role") || action.includes("admin")) return <ShieldCheck className="size-4" />;
    return <Activity className="size-4" />;
  }

  function getActionColor(action: string) {
    if (action.includes("credit") || action.includes("grant")) return "bg-emerald-500/10 text-emerald-600";
    if (action.includes("role") || action.includes("admin")) return "bg-blue-500/10 text-blue-600";
    if (action.includes("delete")) return "bg-red-500/10 text-red-600";
    return "bg-muted text-muted-foreground";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("admin.tabActivity")}</h1>
        <p className="mt-2 text-muted-foreground">{t("admin.subtitle")}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Activity className="size-4" /> {t("admin.totalActions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{recentLogs.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {actionTypes.length} {t("admin.actionTypes")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <BarChart3 className="size-4" /> {t("admin.dailyActivity")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{dailyActivity.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("admin.activeDays")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" /> {t("admin.mostActiveUser")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostActiveUser ? (
              <>
                <p className="font-display text-lg font-bold truncate">{mostActiveUser.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {mostActiveUser.count} {t("admin.actions")}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Coins className="size-4" /> {t("admin.creditActions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">
              {recentLogs.filter((l) => l.action.includes("credit") || l.action.includes("grant")).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("admin.actionBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent>
            {actionStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.noData")}</p>
            ) : (
              <div className="space-y-3">
                {actionStats.map(([action, count], i) => (
                  <div key={action} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{action}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${barColors[i % barColors.length]}`}
                        style={{ width: `${(count / maxActionCount) * 100}%` }}
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("admin.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("admin.filterAction")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.allActions")}</SelectItem>
            {actionTypes.map((action) => (
              <SelectItem key={action} value={action}>
                {action}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("admin.recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          {activityQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.noActivity")}</p>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const user = log.user_id ? userMap.get(log.user_id) : undefined;
                const userName = user?.full_name || user?.email || log.user_id?.slice(0, 8) + "…";
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`grid size-8 place-items-center rounded-full ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {userName}
                          {log.details && typeof log.details === "object"
                            ? ` · ${JSON.stringify(log.details)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {user && roleFor(user.id) !== "admin" && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            title={t("admin.details")}
                            onClick={() =>
                              setDetailsDialog({
                                user,
                                role: roleFor(user.id),
                              })
                            }
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            title={t("admin.addCredits")}
                            onClick={() =>
                              setCreditsDialog({
                                userId: user.id,
                                userName: user.full_name || user.email || "—",
                              })
                            }
                          >
                            <Plus className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive hover:text-destructive"
                            title={t("admin.deleteUser")}
                            onClick={() =>
                              setDeleteDialog({
                                userId: user.id,
                                userName: user.full_name || user.email || "—",
                              })
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {creditsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("admin.addCredits")}</CardTitle>
              <p className="text-sm text-muted-foreground">{creditsDialog.userName}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">{t("admin.creditsAmount")}</label>
                <div className="flex gap-2">
                  {[25, 50, 100, 250, 500].map((v) => (
                    <Button
                      key={v}
                      variant={creditAmount === v ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCreditAmount(v)}
                    >
                      {v}
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  className="mt-2"
                  value={creditAmount}
                  min={1}
                  max={10000}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t("admin.reason")}</label>
                <Input
                  value={creditReason}
                  placeholder={t("admin.reasonPlaceholder")}
                  onChange={(e) => setCreditReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreditsDialog(null);
                    setCreditAmount(50);
                    setCreditReason("");
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  disabled={addCredits.isPending || creditAmount < 1}
                  onClick={() =>
                    addCredits.mutate({
                      data: {
                        userId: creditsDialog.userId,
                        amount: creditAmount,
                        reason: creditReason || undefined,
                      },
                    })
                  }
                >
                  {addCredits.isPending ? "…" : t("admin.confirm")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {detailsDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("admin.detailsTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("admin.name")}</span>
                <span className="text-sm font-medium">{detailsDialog.user.full_name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("admin.email")}</span>
                <span className="text-sm font-medium">{detailsDialog.user.email || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("admin.plan")}</span>
                <Badge variant="secondary">{t(`admin.plan_${detailsDialog.user.plan ?? "free"}` as import("@/lib/i18n").TranslationKey)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("admin.credits")}</span>
                <span className="font-mono text-sm font-medium">
                  {(detailsDialog.user.credits ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("admin.creditsUsed")}</span>
                <span className="font-mono text-sm font-medium">
                  {(detailsDialog.user.credits_used ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t("admin.joined")}</span>
                <span className="text-sm">
                  {detailsDialog.user.created_at
                    ? new Date(detailsDialog.user.created_at).toLocaleDateString("fr-FR")
                    : "—"}
                </span>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setDetailsDialog(null)}>
                  {t("common.close")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("admin.deleteUser")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("admin.deleteConfirm", { name: deleteDialog.userName })}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteUser.isPending}
                  onClick={() =>
                    deleteUser.mutate({
                      data: { userId: deleteDialog.userId },
                    })
                  }
                >
                  {deleteUser.isPending ? "…" : t("common.delete")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
