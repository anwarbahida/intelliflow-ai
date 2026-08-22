import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";
import { PricingPlans } from "@/components/site/PricingPlans";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/my-pricing")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Tarifs — Lexia" },
      {
        name: "description",
        content: "Consultez les plans et choisissez celui qui correspond à vos besoins.",
      },
    ],
  }),
  component: MyPricingPage,
});

function MyPricingPage() {
  const navigate = useNavigate();
  const { data } = useProfile();
  const currentPlan = data?.profile?.plan ?? "free";
  const { t } = useI18n();

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("pricing.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("pricing.subtitle")}</p>
        </div>
        <PricingPlans
          currentPlan={currentPlan}
          onSelect={(code) =>
            navigate({ to: "/checkout", search: { plan: code, cycle: "monthly" } })
          }
        />
      </div>
    </AppShell>
  );
}
