import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Coins, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/integrations/supabase/client";
import { adminListUsers, adminSetRole, adminUpdateUser } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  component: AdminPage,
});

const PLANS = ["free", "pro", "business", "enterprise"] as const;

function AdminPage() {
  const { data } = useProfile();
  const isAdmin = data?.isAdmin;
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [creditInputs, setCreditInputs] = useState<Record<string, string>>({});

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminListUsers(),
    enabled: Boolean(isAdmin),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] });

  const setRole = useMutation({
    mutationFn: adminSetRole,
    onSuccess: () => {
      toast.success(t("admin.roleUpdated"));
      invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("admin.error")),
  });

  const updateUser = useMutation({
    mutationFn: adminUpdateUser,
    onSuccess: () => {
      toast.success(t("admin.userUpdated"));
      invalidate();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t("admin.error")),
  });

  const addCredits = (userId: string) => {
    const raw = creditInputs[userId] ?? "";
    const amount = Number(raw);
    if (!raw || !Number.isFinite(amount) || amount <= 0) return;
    const user = usersQuery.data?.users.find((u) => u.id === userId);
    updateUser.mutate({ data: { userId, credits: (user?.credits ?? 0) + amount } });
    setCreditInputs((prev) => ({ ...prev, [userId]: "" }));
  };

  if (data && !isAdmin) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-destructive/10">
              <ShieldAlert className="size-6 text-destructive" />
            </span>
            <div>
              <p className="font-display text-xl font-bold">{t("admin.deniedTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("admin.deniedText")}</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/dashboard">{t("admin.backToDashboard")}</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const users = usersQuery.data?.users ?? [];
  const roles = usersQuery.data?.roles ?? [];
  const roleFor = (userId: string) => roles.find((r) => r.user_id === userId)?.role ?? "user";
  const stats = {
    total: users.length,
    admins: roles.filter((r) => r.role === "admin").length,
    creditsUsed: users.reduce((sum, u) => sum + (u.credits_used ?? 0), 0),
    creditsTotal: users.reduce((sum, u) => sum + (u.credits ?? 0) + (u.credits_used ?? 0), 0),
  };

  return (
    <AppShell>
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
              <p className="font-display text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="size-4" /> {t("admin.totalAdmins")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">{stats.admins}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Coins className="size-4" /> {t("admin.totalCreditsUsed")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">{stats.creditsUsed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Coins className="size-4" /> {t("admin.totalCredits")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl font-bold">{stats.creditsTotal}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t("admin.usersTable")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {usersQuery.isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">{t("admin.loading")}</p>
            ) : users.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">{t("admin.noUsers")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.name")}</TableHead>
                    <TableHead>{t("admin.email")}</TableHead>
                    <TableHead>{t("admin.plan")}</TableHead>
                    <TableHead>{t("admin.credits")}</TableHead>
                    <TableHead>{t("admin.used")}</TableHead>
                    <TableHead>{t("admin.role")}</TableHead>
                    <TableHead>{t("admin.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isAdminUser = roleFor(user.id) === "admin";
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email ?? "—"}</TableCell>
                        <TableCell>
                          <Select
                            value={user.plan ?? "free"}
                            onValueChange={(plan) =>
                              updateUser.mutate({
                                data: {
                                  userId: user.id,
                                  plan: plan as (typeof PLANS)[number],
                                },
                              })
                            }
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PLANS.map((plan) => (
                                <SelectItem key={plan} value={plan}>
                                  {t(`admin.plan_${plan}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{user.credits ?? 0}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {user.credits_used ?? 0}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isAdminUser ? "default" : "secondary"}>
                            {isAdminUser ? t("admin.roleAdmin") : t("admin.roleUser")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <Label htmlFor={`credits-${user.id}`} className="sr-only">
                                {t("admin.addCredits")}
                              </Label>
                              <Input
                                id={`credits-${user.id}`}
                                type="number"
                                min={1}
                                placeholder="+"
                                value={creditInputs[user.id] ?? ""}
                                onChange={(e) =>
                                  setCreditInputs((prev) => ({
                                    ...prev,
                                    [user.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") addCredits(user.id);
                                }}
                                className="h-8 w-20 font-mono text-xs"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => addCredits(user.id)}
                                disabled={updateUser.isPending}
                              >
                                {t("admin.add")}
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant={isAdminUser ? "ghost" : "default"}
                              className="h-8"
                              disabled={setRole.isPending}
                              onClick={() =>
                                setRole.mutate({
                                  data: {
                                    userId: user.id,
                                    role: isAdminUser ? "user" : "admin",
                                  },
                                })
                              }
                            >
                              {isAdminUser ? t("admin.demote") : t("admin.promote")}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
