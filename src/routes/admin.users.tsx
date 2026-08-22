import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Coins, Crown, Eye, Plus, Search, Trash2, TrendingUp, Users } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProfile } from "@/hooks/useProfile";
import { adminAddCredits, adminDeleteUser, adminListUsers } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/users")({
  ssr: false,
  component: AdminUsers,
});

const PLANS = ["free", "pro", "business", "enterprise"] as const;

function AdminUsers() {
  const { data: profileData } = useProfile();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [creditsDialog, setCreditsDialog] = useState<{ userId: string; userName: string } | null>(
    null,
  );
  const [creditAmount, setCreditAmount] = useState(50);
  const [creditReason, setCreditReason] = useState("");
  const addCreditsFn = useServerFn(adminAddCredits);
  const deleteUserFn = useServerFn(adminDeleteUser);
  const [detailsDialog, setDetailsDialog] = useState<{
    user: { id: string; full_name: string | null; email: string | null; plan: string | null; credits: number | null; credits_used: number | null; created_at: string | null };
    role: string;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ userId: string; userName: string } | null>(null);

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

  const users = usersQuery.data?.users ?? [];
  const roles = usersQuery.data?.roles ?? [];
  const roleFor = (userId: string) => roles.find((r) => r.user_id === userId)?.role ?? "user";

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFor(u.id) === "admin") return false;
      const matchesSearch =
        !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchesPlan = planFilter === "all" || u.plan === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [users, search, planFilter, roles]);

  const nonAdminUsers = useMemo(() => users.filter((u) => roleFor(u.id) !== "admin"), [users, roles]);

  const userStats = useMemo(() => {
    const totalCredits = nonAdminUsers.reduce((s, u) => s + (u.credits ?? 0), 0);
    const totalUsed = nonAdminUsers.reduce((s, u) => s + (u.credits_used ?? 0), 0);
    const planCounts: Record<string, number> = {};
    for (const u of nonAdminUsers) {
      const p = u.plan ?? "free";
      planCounts[p] = (planCounts[p] ?? 0) + 1;
    }
    const topByCredits = [...nonAdminUsers]
      .sort((a, b) => (b.credits_used ?? 0) - (a.credits_used ?? 0))
      .slice(0, 5);
    const topByBalance = [...nonAdminUsers]
      .sort((a, b) => (b.credits ?? 0) - (a.credits ?? 0))
      .slice(0, 5);
    return { totalCredits, totalUsed, planCounts, topByCredits, topByBalance };
  }, [nonAdminUsers]);

  const maxPlanCount = Math.max(...Object.values(userStats.planCounts), 1);
  const planColors: Record<string, string> = { free: "bg-gray-400", pro: "bg-blue-500", business: "bg-emerald-500", enterprise: "bg-purple-500" };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("admin.tabUsers")}</h1>
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
            <p className="font-display text-3xl font-bold">{nonAdminUsers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Coins className="size-4" /> {t("admin.totalCredits")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{userStats.totalCredits.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {userStats.totalUsed.toLocaleString()} {t("admin.used")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" /> {t("admin.creditsUsed")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-3xl font-bold">{userStats.totalUsed.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Crown className="size-4" /> {t("admin.planDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-12">
              {Object.entries(userStats.planCounts).map(([plan, count]) => (
                <div key={plan} className="flex flex-1 flex-col items-center gap-0.5">
                  <div
                    className={`w-full rounded-t ${planColors[plan] ?? "bg-primary"}`}
                    style={{ height: `${(count / maxPlanCount) * 100}%`, minHeight: 2 }}
                  />
                  <span className="text-[9px] text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5 text-amber-500" /> {t("admin.topCreditsUsed")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userStats.topByCredits.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.noData")}</p>
            ) : (
              <div className="space-y-3">
                {userStats.topByCredits.map((user, i) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-amber-500/15 text-amber-600" :
                      i === 1 ? "bg-gray-400/15 text-gray-500" :
                      i === 2 ? "bg-orange-500/15 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{user.full_name || user.email || "—"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold">{(user.credits_used ?? 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Coins className="size-5 text-emerald-500" /> {t("admin.topCreditsBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userStats.topByBalance.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.noData")}</p>
            ) : (
              <div className="space-y-3">
                {userStats.topByBalance.map((user, i) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-amber-500/15 text-amber-600" :
                      i === 1 ? "bg-gray-400/15 text-gray-500" :
                      i === 2 ? "bg-orange-500/15 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{user.full_name || user.email || "—"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold">{(user.credits ?? 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("admin.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("admin.filterPlan")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.allPlans")}</SelectItem>
            {PLANS.map((plan) => (
              <SelectItem key={plan} value={plan}>
                {t(`admin.plan_${plan}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {usersQuery.isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">{t("admin.loading")}</p>
          ) : filteredUsers.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">{t("admin.noUsers")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.name")}</TableHead>
                  <TableHead>{t("admin.email")}</TableHead>
                  <TableHead>{t("admin.plan")}</TableHead>
                  <TableHead className="text-right">{t("admin.credits")}</TableHead>
                  <TableHead className="text-right">{t("admin.creditsUsed")}</TableHead>
                  <TableHead>{t("admin.joined")}</TableHead>
                  <TableHead>{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t(`admin.plan_${user.plan ?? "free"}` as import("@/lib/i18n").TranslationKey)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono text-sm">
                          {(user.credits ?? 0).toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
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
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm">
                        {(user.credits_used ?? 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          title={t("admin.details")}
                          onClick={() =>
                            setDetailsDialog({
                              user,
                              role: roleFor(user.id),
                            })
                          }
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:text-destructive"
                          title={t("admin.deleteUser")}
                          onClick={() =>
                            setDeleteDialog({
                              userId: user.id,
                              userName: user.full_name || user.email || "—",
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                <label className="mb-1 block text-sm font-medium">
                  {t("admin.creditsAmount")}
                </label>
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
