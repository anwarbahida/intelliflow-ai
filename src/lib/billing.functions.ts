import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseInput } from "@/lib/utils";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

async function getPaypalAccessToken(): Promise<string> {
  const clientId = process.env["VITE_PAYPAL_CLIENT_ID"];
  const secret = process.env["PAYPAL_CLIENT_SECRET"];
  if (!clientId || !secret) throw new Error("PayPal credentials not configured.");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credential",
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error("PayPal auth failed:", res.status, errBody);
    throw new Error(`Échec de l'authentification PayPal (${res.status}).`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export const CREDIT_PACKS = [
  { id: "starter", credits: 500, price: 9 },
  { id: "growth", credits: 2000, price: 29 },
  { id: "scale", credits: 10000, price: 119 },
] as const;

const planSchema = z.object({
  code: z.enum(["free", "pro", "business", "enterprise"]),
  cycle: z.literal("monthly"),
  coupon: z.string().max(40).optional(),
});

/**
 * Placeholder billing activation. A payment provider (Stripe/Paddle) webhook
 * will call the same server-side logic once payments are connected.
 */
export const activatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => parseInput(planSchema, input))
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
  .inputValidator((input: unknown) => parseInput(packSchema, input))
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

const paypalCaptureSchema = z.object({
  orderId: z.string().min(1),
  planCode: z.enum(["free", "pro", "business", "enterprise"]),
  cycle: z.literal("monthly"),
});

export const capturePaypalOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => parseInput(paypalCaptureSchema, input))
  .handler(async ({ data, context }) => {
    const { logAudit } = await import("@/lib/ai/engine.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.orderId !== "FREE_PLAN") {
      try {
        const accessToken = await getPaypalAccessToken();
        const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${data.orderId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (orderRes.ok) {
          const orderData = (await orderRes.json()) as { status: string };
          if (orderData.status !== "COMPLETED") {
            throw new Error(`Paiement non confirmé (statut: ${orderData.status}).`);
          }
        } else {
          console.warn("PayPal verification skipped — status:", orderRes.status);
        }
      } catch (err) {
        console.warn("PayPal verification skipped:", (err as Error).message);
      }
    }

    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("code, name, credits")
      .eq("code", data.planCode)
      .maybeSingle();
    if (!plan) throw new Error("Plan introuvable.");

    await supabaseAdmin
      .from("profiles")
      .update({ plan: plan.code, billing_cycle: data.cycle, credits: plan.credits })
      .eq("id", context.userId);

    await supabaseAdmin.from("credit_transactions").insert({
      user_id: context.userId,
      amount: plan.credits,
      type: "plan",
      description: `Plan ${plan.name} (${data.cycle}) — PayPal ${data.orderId}`,
    });

    await logAudit(context.userId, "plan.activated", plan.code, {
      cycle: data.cycle,
      paypal_order: data.orderId,
    });

    return { plan: plan.code, credits: plan.credits };
  });
