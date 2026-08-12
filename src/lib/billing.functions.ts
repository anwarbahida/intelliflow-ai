import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CREDIT_PACKS = [
  { id: "starter", credits: 500, price: 9 },
  { id: "growth", credits: 2000, price: 29 },
  { id: "scale", credits: 10000, price: 119 },
] as const;

const planSchema = z.object({
  code: z.enum(["free", "pro", "business", "enterprise"]),
  cycle: z.enum(["monthly", "yearly"]),
  coupon: z.string().max(40).optional(),
});

/**
 * Placeholder billing activation. A payment provider (Stripe/Paddle) webhook
 * will call the same server-side logic once payments are connected.
 */
export const activatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => planSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { logAudit } = await import("@/lib/ai/engine.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("code, name, credits, price_monthly, price_yearly")
      .eq("code", data.code)
      .maybeSingle();
    if (!plan) throw new Error("Plan introuvable.");

    let bonus = 0;
    if (data.coupon) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("id, code, credits_bonus, is_active, max_redemptions, times_redeemed, expires_at")
        .eq("code", data.coupon.toUpperCase())
        .maybeSingle();
      if (!coupon || !coupon.is_active) throw new Error("Code promo invalide.");
      if (coupon.times_redeemed >= coupon.max_redemptions) throw new Error("Code promo épuisé.");
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
        throw new Error("Code promo expiré.");
      bonus = coupon.credits_bonus;
      await supabaseAdmin
        .from("coupons")
        .update({ times_redeemed: coupon.times_redeemed + 1 })
        .eq("id", coupon.id);
    }

    await supabaseAdmin
      .from("profiles")
      .update({ plan: plan.code, billing_cycle: data.cycle, credits: plan.credits + bonus })
      .eq("id", context.userId);

    await supabaseAdmin.from("credit_transactions").insert({
      user_id: context.userId,
      amount: plan.credits + bonus,
      type: "plan",
      description: `Activation du plan ${plan.name} (${data.cycle})`,
    });

    await logAudit(context.userId, "plan.activated", plan.code, { cycle: data.cycle, bonus });

    return { plan: plan.code, credits: plan.credits + bonus };
  });

const packSchema = z.object({ pack: z.enum(["starter", "growth", "scale"]) });

export const purchaseCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => packSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { logAudit } = await import("@/lib/ai/engine.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const pack = CREDIT_PACKS.find((p) => p.id === data.pack);
    if (!pack) throw new Error("Pack inconnu.");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", context.userId)
      .maybeSingle();

    await supabaseAdmin
      .from("profiles")
      .update({ credits: (profile?.credits ?? 0) + pack.credits })
      .eq("id", context.userId);

    await supabaseAdmin.from("credit_transactions").insert({
      user_id: context.userId,
      amount: pack.credits,
      type: "purchase",
      description: `Pack ${pack.id} — ${pack.credits} crédits`,
    });

    await logAudit(context.userId, "credits.purchased", pack.id, { credits: pack.credits });

    return { credits: pack.credits };
  });
