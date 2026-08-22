import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect, useSearch } from "@tanstack/react-router";
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useI18n, translations, type Locale } from "@/lib/i18n";
import { capturePaypalOrder } from "@/lib/billing.functions";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    plan: (search["plan"] as string) || "pro",
    cycle: "monthly" as const,
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "login" } });
  },
  head: () => ({
    meta: [
      { title: "Paiement — Lexia" },
      { name: "description", content: "Finalisez votre commande Lexia." },
    ],
  }),
  component: CheckoutWrapper,
});

function CheckoutWrapper() {
  const paypalClientId = import.meta.env["VITE_PAYPAL_CLIENT_ID"] as string;
  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: "EUR",
        intent: "capture",
      }}
    >
      <CheckoutPageInner />
    </PayPalScriptProvider>
  );
}

function getPlanTranslation(code: string, lang: Locale) {
  const rec = (translations[lang] as Record<string, unknown>)["plans"] as
    | Record<string, { name: string; tagline: string; features: string[] }>
    | undefined;
  if (rec?.[code]) return rec[code];
  const fb = (translations.fr as Record<string, unknown>)["plans"] as Record<
    string,
    { name: string; tagline: string; features: string[] }
  >;
  return fb?.[code] ?? { name: code, tagline: "", features: [] };
}

function CheckoutPageInner() {
  const { plan: planCode, cycle } = useSearch({ from: Route.id });
  const { data, isLoading: profileLoading } = useProfile();
  const profile = data?.profile;
  const { t, lang } = useI18n();
  const [{ isPending: paypalLoading }] = usePayPalScriptReducer();

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select(
          "id, code, name, tagline, price_monthly, price_yearly, credits, features, is_featured",
        )
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const plan = plans?.find((p) => p.code === planCode);
  const tr = getPlanTranslation(planCode, lang);
  const price = plan?.price_monthly ?? 0;
  const isFree = planCode === "free";

  const activateMutation = useMutation({
    mutationFn: (orderId: string) =>
      capturePaypalOrder({
        data: { orderId, planCode: planCode as "free" | "pro" | "business" | "enterprise", cycle },
      }),
    onSuccess: () => {
      toast.success(t("checkout.success"));
      window.location.href = "/dashboard";
    },
    onError: (e: Error) => {
      toast.error(e.message || t("checkout.error"));
    },
  });

  if (profileLoading || plansLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg space-y-6 py-20">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!plan) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg py-20 text-center">
          <p className="text-muted-foreground">{t("checkout.error")}</p>
          <Button asChild variant="outline" className="mt-4">
              <Link to="/my-pricing">{t("checkout.backToPricing")}</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const isCurrentPlan = profile?.plan === planCode;

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("checkout.title")}</h1>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t("checkout.summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("checkout.plan")}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{tr.name || plan.name}</span>
                {plan.is_featured && (
                  <Badge className="bg-gradient-primary border-0 text-xs">
                    {t("pricing.recommended")}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("checkout.cycle")}</span>
              <span className="font-medium">{t("checkout.monthly")}</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("checkout.credits")}</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="size-3.5 text-primary" />
                {plan.credits.toLocaleString()}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">{t("checkout.price")}</span>
              <span className="font-display text-2xl font-bold">
                {isFree ? "Gratuit" : `${price} €`}
                {!isFree && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {t("pricing.perMonth")}
                  </span>
                )}
              </span>
            </div>

            <div className="pt-2">
              {isFree ? (
                <Button
                  onClick={() => activateMutation.mutate("FREE_PLAN")}
                  disabled={activateMutation.isPending || isCurrentPlan}
                  className="w-full"
                  size="lg"
                >
                  {activateMutation.isPending
                    ? t("checkout.processing")
                    : isCurrentPlan
                      ? t("pricing.active")
                      : t("pricing.startFree")}
                </Button>
              ) : isCurrentPlan ? (
                <Button disabled className="w-full" size="lg">
                  {t("pricing.active")}
                </Button>
              ) : (
                <div className="flex justify-center">
                  {paypalLoading ? (
                    <Button disabled className="w-full" size="lg">
                      {t("checkout.processing")}
                    </Button>
                  ) : (
                    <PayPalButtons
                      style={{ layout: "vertical", label: "paypal", color: "blue", shape: "rect" }}
                      disabled={activateMutation.isPending || isCurrentPlan}
                      createOrder={(_data, actions) => {
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [
                            {
                              amount: {
                                value: price.toFixed(2),
                                currency_code: "EUR",
                              },
                              description: `Lexia ${tr.name || plan.name} — Mensuel`,
                            },
                          ],
                        });
                      }}
                      onApprove={async (data, actions) => {
                        await actions.order!.capture();
                        activateMutation.mutate(data.orderID!);
                      }}
                      onError={(err) => {
                        console.error("PayPal error:", err);
                        toast.error(t("checkout.paypalError"));
                      }}
                      onCancel={() => {
                        toast.info(t("checkout.cancel"));
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="size-3.5" />
              {t("checkout.secure")}
            </div>

            <Button asChild variant="ghost" className="w-full">
            <Link to="/my-pricing">{t("checkout.backToPricing")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
