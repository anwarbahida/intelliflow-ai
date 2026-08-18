import { createFileRoute } from "@tanstack/react-router";

import { PricingPlans } from "@/components/site/PricingPlans";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Tarifs — Lexia, analyse documentaire IA" },
      {
        name: "description",
        content:
          "Plans Free, Pro, Business et Enterprise : crédits IA inclus, facturation mensuelle ou annuelle, sans engagement.",
      },
      { property: "og:title", content: "Tarifs Lexia" },
      { property: "og:description", content: "Choisissez le volume de crédits IA adapté à votre équipe." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="relative overflow-hidden px-4 py-20 sm:px-6">
        <div className="hero-glow" aria-hidden />
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-bold sm:text-5xl">{t("pricing.title")}</h1>
            <p className="mt-5 text-lg text-muted-foreground">{t("pricing.subtitle")}</p>
          </div>
          <PricingPlans />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
