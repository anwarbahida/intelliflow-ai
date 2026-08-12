import { AI_FEATURES, type AiFeatureKey } from "./features";
import { AiError, estimateCost, runAi } from "./provider.server";

const MAX_CONTENT_CHARS = 24_000;
const RATE_WINDOW_MINUTES = 1;
const RATE_MAX_CALLS = 12;

type AdminClient = Awaited<
  typeof import("@/integrations/supabase/client.server")
>["supabaseAdmin"];

async function admin(): Promise<AdminClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function enforceRateLimit(userId: string) {
  const db = await admin();
  const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60_000).toISOString();
  const { count } = await db
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_MAX_CALLS) {
    throw new AiError("Limite de requêtes atteinte. Patiente une minute.", 429);
  }
}

export async function getProfile(userId: string) {
  const db = await admin();
  const { data, error } = await db
    .from("profiles")
    .select("id, plan, credits, credits_used, full_name, goal")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new AiError("Profil introuvable.", 500);
  if (!data) throw new AiError("Profil introuvable.", 404);
  return data;
}

export async function chargeCredits(args: {
  userId: string;
  feature: string;
  credits: number;
  model: string;
  tokens: number;
}) {
  const db = await admin();
  const profile = await getProfile(args.userId);
  await db
    .from("profiles")
    .update({
      credits: Math.max(0, profile.credits - args.credits),
      credits_used: profile.credits_used + args.credits,
    })
    .eq("id", args.userId);

  await db.from("credit_transactions").insert({
    user_id: args.userId,
    amount: -args.credits,
    type: "usage",
    description: args.feature,
  });

  await db.from("ai_usage_logs").insert({
    user_id: args.userId,
    feature: args.feature,
    model: args.model,
    credits: args.credits,
    tokens: args.tokens,
    cost_estimate: estimateCost(args.tokens),
  });
}

export async function runFeature(args: {
  userId: string;
  feature: AiFeatureKey;
  content: string;
  question?: string | undefined;
  extraSystem?: string | undefined;
}) {
  const feature = AI_FEATURES[args.feature];
  if (!feature) throw new AiError("Fonctionnalité inconnue.", 400);

  await enforceRateLimit(args.userId);
  const profile = await getProfile(args.userId);
  if (profile.credits < feature.credits) {
    throw new AiError(
      `Crédits insuffisants : cette action coûte ${feature.credits} crédits, il t'en reste ${profile.credits}.`,
      402,
    );
  }

  const content = args.content.slice(0, MAX_CONTENT_CHARS);
  const userParts = [
    args.question ? `Question de l'utilisateur : ${args.question}` : null,
    content ? `Contenu à analyser :\n\n${content}` : null,
  ].filter(Boolean);

  const result = await runAi(
    [
      { role: "system", content: [feature.system, args.extraSystem].filter(Boolean).join("\n\n") },
      { role: "user", content: userParts.join("\n\n") || "Analyse générale." },
    ],
    { tier: feature.tier },
  );

  await chargeCredits({
    userId: args.userId,
    feature: feature.key,
    credits: feature.credits,
    model: result.model,
    tokens: result.tokens,
  });

  return { text: result.text, model: result.model, credits: feature.credits };
}

export async function logAudit(userId: string | null, action: string, target?: string, details?: unknown) {
  const db = await admin();
  await db.from("audit_logs").insert({
    user_id: userId,
    action,
    target: target ?? null,
    details: (details ?? null) as never,
  });
}
