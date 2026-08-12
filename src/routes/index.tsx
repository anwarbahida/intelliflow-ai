import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  FileSearch,
  FileText,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { PricingPlans } from "@/components/site/PricingPlans";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AI_FEATURE_LIST } from "@/lib/ai/features";

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

const steps = [
  { title: "Déposez votre document", text: "Collez ou importez un contrat, un rapport, un compte-rendu." },
  { title: "Choisissez une analyse", text: "Résumé, extraction, risques, finance, rapport — chacune a son coût en crédits." },
  { title: "Décidez plus vite", text: "Résultat structuré, exportable, historisé dans votre espace." },
];

const useCases = [
  { icon: ShieldCheck, title: "Juridique", text: "Détection de clauses à risque, obligations, échéances et pénalités." },
  { icon: BarChart3, title: "Finance", text: "Extraction de montants, ratios, engagements et anomalies chiffrées." },
  { icon: FileSearch, title: "Conseil & RFP", text: "Synthèse d'appels d'offres et comparaison de dossiers volumineux." },
  { icon: Bot, title: "Opérations", text: "Comptes-rendus transformés en plans d'action assignables." },
];

function Landing() {
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
                Analyse documentaire augmentée par l'IA
              </Badge>
              <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Vos documents, lus et compris{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">en 30 secondes</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Lexia transforme contrats, rapports et dossiers en résumés fiables, données
                structurées, risques identifiés et rapports prêts à envoyer.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Commencer gratuitement <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/pricing">Voir les tarifs</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                50 crédits IA offerts · sans carte bancaire · données chiffrées
              </p>
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
                        Synthèse IA
                      </p>
                      {[
                        "Contrat de prestation, 24 mois, renouvellement tacite.",
                        "Pénalité de retard : 1,5 % par semaine entamée.",
                        "Clause de résiliation asymétrique en faveur du client.",
                      ].map((line) => (
                        <div key={line} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                          {line}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Risques détectés
                      </p>
                      {[
                        { label: "Résiliation unilatérale", level: "Élevé" },
                        { label: "Indexation tarifaire absente", level: "Moyen" },
                        { label: "Confidentialité limitée", level: "Faible" },
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

        {/* Features */}
        <section id="features" className="border-t border-border/60 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Une suite d'analyses IA, facturée au crédit
              </h2>
              <p className="mt-4 text-muted-foreground">
                Chaque analyse a un coût transparent. Vous ne payez que ce que vous utilisez.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {AI_FEATURE_LIST.map((feature) => (
                <Card key={feature.key} className="group transition-all hover:-translate-y-1 hover:shadow-glow">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center justify-between">
                      <span className="grid size-10 place-items-center rounded-xl bg-primary/10">
                        <FileText className="size-5 text-primary" />
                      </span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {feature.credits} cr.
                      </Badge>
                    </div>
                    <p className="font-display font-semibold">{feature.label}</p>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border/60 bg-surface/40 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Trois étapes, zéro friction</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step, i) => (
                <Card key={step.title}>
                  <CardContent className="space-y-3 p-6">
                    <span className="font-display text-4xl font-bold text-primary/30">0{i + 1}</span>
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
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Fait pour les métiers du document</h2>
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
        <section id="pricing" className="border-t border-border/60 bg-surface/40 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl space-y-10">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Des tarifs lisibles</h2>
              <p className="mt-4 text-muted-foreground">
                Un plan gratuit pour tester, des plans payants pour industrialiser.
              </p>
            </div>
            <PricingPlans compact />
          </div>
        </section>

        {/* Security + FAQ */}
        <section id="faq" className="border-t border-border/60 px-4 py-24 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Sécurité par défaut</h2>
              {[
                { icon: Lock, title: "Cloisonnement strict", text: "Chaque document est isolé par utilisateur au niveau base de données." },
                { icon: ShieldCheck, title: "Crédits inviolables", text: "Le solde et le plan ne peuvent être modifiés que côté serveur." },
                { icon: Zap, title: "Limites anti-abus", text: "Rate limiting par utilisateur et journalisation de chaque appel IA." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Accordion type="single" collapsible className="w-full">
              {[
                { q: "Comment fonctionnent les crédits ?", a: "Chaque analyse consomme un nombre de crédits fixe et affiché avant lancement. Les crédits sont rechargés à chaque cycle de facturation, et des packs supplémentaires sont disponibles." },
                { q: "Mes documents sont-ils utilisés pour entraîner des modèles ?", a: "Non. Vos contenus servent uniquement à produire vos analyses et restent rattachés à votre compte." },
                { q: "Puis-je annuler à tout moment ?", a: "Oui, les plans mensuels sont sans engagement. Le plan annuel offre deux mois gratuits." },
                { q: "Quels formats sont supportés ?", a: "Texte collé et documents texte importés. Les analyses acceptent jusqu'à 24 000 caractères par exécution." },
              ].map((item) => (
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
              Arrêtez de lire. Commencez à décider.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Créez votre compte et lancez votre première analyse en moins de deux minutes.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link to="/auth" search={{ mode: "signup" }}>
                Créer mon compte gratuit <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
