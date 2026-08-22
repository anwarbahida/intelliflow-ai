import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  Copy,
  Mail,
  Pencil,
  ShieldCheck,
  Sparkles,
  Target,
  User as UserIcon,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, planLimits } from "@/hooks/useProfile";
import { useI18n } from "@/lib/i18n";
import { updateProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/profile")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Profil — Lexia" },
      { name: "description", content: "Consultez et gérez vos informations de profil Lexia." },
      { property: "og:title", content: "Profil — Lexia" },
    ],
  }),
  component: ProfilePage,
});

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { data, isLoading } = useProfile();
  const profile = data?.profile;
  const isAdmin = data?.isAdmin;
  const { t } = useI18n();
  const limits = planLimits(profile?.plan);
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [goal, setGoal] = useState("");

  const [copied, setCopied] = useState(false);
  const referralCode = profile?.referral_code ?? "";

  const handleCopyCode = useCallback(() => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      toast.success(t("profile.codeCopied"));
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralCode, t]);

  function startEditing() {
    setFullName(profile?.full_name ?? "");
    setCompany(profile?.company ?? "");
    setGoal(profile?.goal ?? "");
    setEditing(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        data: { fullName, company, goal },
      }),
    onSuccess: () => {
      toast.success(t("profile.updateSuccess"));
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => {
      toast.error(t("profile.updateError"));
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <p className="py-20 text-center text-muted-foreground">{t("common.loading")}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{t("profile.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("profile.subtitle")}</p>
          </div>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="mr-1.5 size-3.5" />
              {t("profile.edit")}
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-primary/10">
                <UserIcon className="size-7 text-primary" />
              </span>
              <div>
                <CardTitle className="text-xl">
                  {editing ? (
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t("profile.fullName")}
                      className="max-w-sm"
                    />
                  ) : (
                    profile?.full_name || "—"
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{profile?.email || "—"}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />

            <div className="grid gap-5 sm:grid-cols-2">
              <InfoRow icon={Mail} label={t("profile.email")} value={profile?.email} />
              {editing ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
                      <Building2 className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="company" className="text-sm text-muted-foreground">
                        {t("profile.company")}
                      </Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder={t("profile.company")}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
                      <Target className="size-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="goal" className="text-sm text-muted-foreground">
                        {t("profile.goal")}
                      </Label>
                      <Textarea
                        id="goal"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder={t("profile.goal")}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <InfoRow icon={Building2} label={t("profile.company")} value={profile?.company} />
                  <InfoRow icon={Target} label={t("profile.goal")} value={profile?.goal} />
                </>
              )}
              <InfoRow
                icon={ShieldCheck}
                label={t("profile.role")}
                value={isAdmin ? t("profile.roleAdmin") : t("profile.roleUser")}
              />
              <InfoRow
                icon={Calendar}
                label={t("profile.memberSince")}
                value={
                  profile?.id
                    ? new Date(
                        parseInt(profile.id.replace(/-/g, "").slice(0, 8), 16) * 1000,
                      ).toLocaleDateString()
                    : "—"
                }
              />
            </div>

            <Separator />

            <div className="grid gap-5 sm:grid-cols-2">
              <Card className="bg-muted/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <Sparkles className="size-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("profile.plan")}</p>
                    <p className="font-semibold">{limits.label}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <Sparkles className="size-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("profile.credits")}</p>
                    <p className="font-semibold">
                      {profile?.credits ?? 0} /{" "}
                      {(profile?.credits ?? 0) + (profile?.credits_used ?? 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {editing && (
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? t("common.loading") : t("profile.saveChanges")}
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  <X className="mr-1.5 size-3.5" />
                  {t("common.cancel")}
                </Button>
              </div>
            )}

            {referralCode && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">{t("profile.referralCode")}</p>
                  <div className="flex items-center gap-2">
                    <code className="rounded-md bg-muted px-3 py-1.5 font-mono text-sm">
                      {referralCode}
                    </code>
                    <Button variant="outline" size="sm" onClick={handleCopyCode}>
                      <Copy className="mr-1.5 size-3.5" />
                      {copied ? t("profile.copied") : t("profile.copy")}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
