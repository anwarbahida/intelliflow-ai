import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  FileSearch,
  FileText,
  Lock,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { Markdown } from "@/components/Markdown";
import { PricingPlans } from "@/components/site/PricingPlans";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AI_FEATURE_LIST } from "@/lib/ai/features";
import { useI18n, featureLabelKey, featureDescriptionKey, translations } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lexia — L'IA qui analyse vos documents en secondes" },
      {
        name: "description",
        content:
          "Contrats, rapports, factures : Lexia résume, extrait les données clés, détecte les risques et génère des rapports professionnels grâce à l'IA.",
      },
      { property: "og:title", content: "Lexia — Intelligence documentaire par IA" },
      {
        property: "og:description",
        content: "Résumés, extraction, analyse de risques et rapports IA en quelques secondes.",
      },
    ],
  }),
  component: Landing,
});

const useCaseIcons = [
  { icon: ShieldCheck },
  { icon: BarChart3 },
  { icon: FileSearch },
  { icon: Bot },
];

function Landing() {
  const { t, tList, lang } = useI18n();
  const steps = translations[lang].landing.steps;
  const useCases = translations[lang].landing.useCases.map((uc, i) => ({
    ...uc,
    icon: useCaseIcons[i]?.icon ?? Bot,
  }));
  const security = translations[lang].landing.security;
  const faqItems = translations[lang].landing.faqItems;
  const demoLines = tList("landing.demoLines");
  const demoRiskLabels = tList("landing.demoRiskLabels");

  const [demoText, setDemoText] = useState("");
  const [demoResult, setDemoResult] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState(false);

  const runDemo = async () => {
    if (demoText.trim().length < 40) return;
    setDemoLoading(true);
    setDemoError(false);
    setDemoResult("");
    try {
      const { runPublicDemo } = await import("@/lib/ai.functions");
      const res = await runPublicDemo({ data: { text: demoText } });
      setDemoResult(res.text ?? "");
    } catch {
      setDemoError(true);
    } finally {
      setDemoLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6">
          <div className="hero-glow" aria-hidden />
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-6 gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                {t("landing.heroBadge")}
              </Badge>
              <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                {t("landing.heroTitle1")}{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  {t("landing.heroTitleHighlight")}
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                {t("landing.heroSubtitle")}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    {t("landing.heroCta1")} <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/pricing">{t("landing.heroCta2")}</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{t("landing.heroFreeNote")}</p>
            </div>

            <div className="mx-auto mt-16 max-w-4xl">
              <Card className="glass-panel overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 border-b border-border/60 px-5 py-3">
                    <span className="size-2.5 rounded-full bg-destructive/70" />
                    <span className="size-2.5 rounded-full bg-warning/70" />
                    <span className="size-2.5 rounded-full bg-success/70" />
                    <span className="ml-3 font-mono text-xs text-muted-foreground">
                      contrat-prestation-2026.pdf
                    </span>
                  </div>
                  <div className="grid gap-6 p-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("landing.demoSummary")}
                      </p>
                      {demoLines.map((line) => (
                        <div key={line} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          {line}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("landing.demoRisks")}
                      </p>
                      {[
                        { label: demoRiskLabels[0] ?? "", level: t("landing.riskHigh") },
                        { label: demoRiskLabels[1] ?? "", level: t("landing.riskMedium") },
                        { label: demoRiskLabels[2] ?? "", level: t("landing.riskLow") },
                      ].map((risk) => (
                        <div
                          key={risk.label}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-surface/60 px-3 py-2 text-sm"
                        >
                          <span>{risk.label}</span>
                          <Badge variant="secondary">{risk.level}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Interactive Demo */}
        <section id="demo" className="border-t border-border/60 bg-surface/40 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                {t("landing.demoTitle")}
              </h2>
              <p className="mt-4 text-muted-foreground">{t("landing.demoSubtitle")}</p>
            </div>
            <Card className="mt-12 glass-panel">
              <CardContent className="space-y-4 p-6">
                <Textarea
                  value={demoText}
                  onChange={(e) => setDemoText(e.target.value)}
                  placeholder={t("landing.demoPlaceholder")}
                  rows={6}
                  className="resize-none text-sm"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{t("landing.demoNote")}</p>
                  <Button
                    onClick={runDemo}
                    disabled={demoLoading || demoText.trim().length < 40}
                    size="sm"
                  >
                    {demoLoading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 size-4" />
                    )}
                    {demoLoading ? t("landing.demoRunning") : t("landing.demoRun")}
                  </Button>
                </div>
                {demoError && (
                  <p className="text-sm text-destructive">{t("landing.demoError")}</p>
                )}
                {demoResult && (
                  <div className="rounded-lg border border-border/60 bg-background/60 p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("landing.demoResultTitle")}
                    </p>
                    <div className="prose-sm prose-neutral dark:prose-invert max-w-none">
                      <Markdown content={demoResult} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border/60 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                {t("landing.featuresTitle")}
              </h2>
              <p className="mt-4 text-muted-foreground">{t("landing.featuresSubtitle")}</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {AI_FEATURE_LIST.map((feature) => (
                <Card
                  key={feature.key}
                  className="group transition-all hover:-translate-y-1 hover:shadow-glow"
                >
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10">
                        <FileText className="size-5 text-primary" />
                      </span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {t("credits.short", { credits: feature.credits })}
                      </Badge>
                    </div>
                    <p className="font-display font-semibold">{t(featureLabelKey(feature.key))}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(featureDescriptionKey(feature.key))}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border/60 bg-surface/40 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("landing.howTitle")}</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <Card key={step.title}>
                  <CardContent className="space-y-3 p-6">
                    <span className="font-display text-4xl font-bold text-primary/30">
                      0{i + 1}
                    </span>
                    <p className="font-display text-lg font-semibold">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section id="use-cases" className="border-t border-border/60 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              {t("landing.useCasesTitle")}
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {useCases.map(({ icon: Icon, title, text }) => (
                <Card key={title}>
                  <CardContent className="flex gap-4 p-6">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-primary">
                      <Icon className="size-5 text-primary-foreground" />
                    </span>
                    <div className="space-y-1.5">
                      <p className="font-display font-semibold">{title}</p>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="border-t border-border/60 bg-surface/40 px-4 py-24 sm:px-6"
        >
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                {t("landing.pricingTitle")}
              </h2>
              <p className="mt-4 text-muted-foreground">{t("landing.pricingSubtitle")}</p>
            </div>
            <PricingPlans compact />
          </div>
        </section>

        {/* Security + FAQ */}
        <section id="faq" className="border-t border-border/60 px-4 py-24 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                {t("landing.securityTitle")}
              </h2>
              {security.map(({ title, text }, i) => {
                const Icon = [Lock, ShieldCheck, Zap][i] ?? ShieldCheck;
                return (
                  <div key={title} className="flex gap-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </span>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-primary p-10 text-center sm:p-16">
            <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
              {t("landing.ctaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              {t("landing.ctaSubtitle")}
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link to="/auth" search={{ mode: "signup" }}>
                {t("site.createAccountFree")} <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
