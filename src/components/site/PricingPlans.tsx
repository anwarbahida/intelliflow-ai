import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Plan = {
  id: string;
  code: string;
  name: string;
  tagline: string | null;
  price_monthly: number;
  price_yearly: number;
  credits: number;
  features: unknown;
  is_featured: boolean;
};

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("id, code, name, tagline, price_monthly, price_yearly, credits, features, is_featured")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
  });
}

export function planFeatures(plan: Plan): string[] {
  return Array.isArray(plan.features) ? (plan.features as string[]) : [];
}

export function PricingPlans({
  onSelect,
  currentPlan,
  compact = false,
}: {
  onSelect?: (code: string, cycle: "monthly" | "yearly") => void;
  currentPlan?: string;
  compact?: boolean;
}) {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const { data: plans, isLoading } = usePlans();
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-border bg-card p-1">
          {(["monthly", "yearly"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setCycle(value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                cycle === value
                  ? "bg-gradient-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "monthly" ? t("pricing.monthlyLabel") : t("pricing.yearlyLabel")}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {cycle === "yearly" ? t("pricing.yearlyNote") : t("pricing.monthlyNote")}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="mt-4 h-10 w-32" />
              <div className="mt-6 space-y-2">
                {Array.from({ length: 5 }).map((__, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </Card>
          ))}

        {plans?.map((plan) => {
          const price = cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
          const isEnterprise = plan.code === "enterprise";
          const isCurrent = currentPlan === plan.code;
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1",
                plan.is_featured && "border-primary/60 shadow-glow",
              )}
            >
              {plan.is_featured && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" />
              )}
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-semibold">{plan.name}</span>
                  {plan.is_featured && <Badge className="bg-gradient-primary border-0">{t("pricing.recommended")}</Badge>}
                  {isCurrent && !plan.is_featured && <Badge variant="secondary">{t("pricing.currentPlan")}</Badge>}
                </div>
                <p className="min-h-10 text-sm text-muted-foreground">{plan.tagline}</p>
                <div className="flex items-end gap-1">
                  <span className="font-display text-4xl font-bold">
                    {isEnterprise ? t("pricing.customQuote") : `${price} €`}
                  </span>
                  {!isEnterprise && (
                    <span className="pb-1 text-sm text-muted-foreground">
                      {cycle === "monthly" ? t("pricing.perMonth") : t("pricing.perYear")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Sparkles className="size-3.5" />
                  {t("pricing.creditsAIPerMonth", { credits: plan.credits.toLocaleString() })}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                <ul className="flex-1 space-y-2.5">
                  {planFeatures(plan)
                    .slice(0, compact ? 5 : 12)
                    .map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        {feature}
                      </li>
                    ))}
                </ul>
                {onSelect ? (
                  <Button
                    onClick={() => onSelect(plan.code, cycle)}
                    variant={plan.is_featured ? "default" : "outline"}
                    disabled={isCurrent}
                    className="w-full"
                  >
                    {isCurrent
                      ? t("pricing.active")
                      : isEnterprise
                        ? t("pricing.talkToExpert")
                        : t("pricing.choose", { name: plan.name })}
                  </Button>
                ) : (
                  <Button asChild variant={plan.is_featured ? "default" : "outline"} className="w-full">
                    <Link to="/auth" search={{ mode: "signup", redirect: "" }}>
                      {plan.code === "free"
                        ? t("pricing.startFree")
                        : t("pricing.choose", { name: plan.name })}
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
