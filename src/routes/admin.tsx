import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { data, isLoading } = useProfile();
  const isAdmin = data?.isAdmin;
  const { t } = useI18n();

  if (isLoading) {
    return (
      <AppShell>
        <p className="py-20 text-center text-muted-foreground">{t("common.loading")}</p>
      </AppShell>
    );
  }

  if (!isAdmin) {
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

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
