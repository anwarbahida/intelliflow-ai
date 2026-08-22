import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { parseInput } from "@/lib/utils";

export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error || !roles?.some((r) => r.role === "admin")) {
      throw new Error("Accès refusé : rôle administrateur requis.");
    }
    return next({ context });
  });

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "user"]),
});

const updateSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(["free", "pro", "business", "enterprise"]).optional(),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
  credits: z.number().int().min(0).max(1_000_000).optional(),
  creditsUsed: z.number().int().min(0).max(1_000_000).optional(),
});

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] =
        await Promise.all([
          supabaseAdmin
            .from("profiles")
            .select("id, email, full_name, plan, billing_cycle, credits, credits_used, created_at")
            .order("created_at", { ascending: false }),
          supabaseAdmin.from("user_roles").select("user_id, role"),
        ]);
      if (profilesError || rolesError) return { users: [], roles: [] };
      return { users: profiles ?? [], roles: roles ?? [] };
    } catch {
      return { users: [], roles: [] };
    }
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => parseInput(roleSchema, input))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId && data.role !== "admin") {
      throw new Error("Impossible de retirer ton propre rôle administrateur.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.role === "admin") {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
    } else {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
    }
    return { ok: true };
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => parseInput(updateSchema, input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Database["public"]["Tables"]["profiles"]["Update"] = {};
    if (data.plan !== undefined) patch.plan = data.plan;
    if (data.billingCycle !== undefined) patch.billing_cycle = data.billingCycle;
    if (data.credits !== undefined) patch.credits = data.credits;
    if (data.creditsUsed !== undefined) patch.credits_used = data.creditsUsed;
    await supabaseAdmin.from("profiles").update(patch).eq("id", data.userId);
    return { ok: true };
  });

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
});

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => parseInput(deleteUserSchema, input))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) {
      throw new Error("Impossible de supprimer votre propre compte.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("documents").delete().eq("user_id", data.userId);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);

    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);

    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: "admin_delete_user",
      target: data.userId,
      details: {} as never,
    });

    try {
      await supabaseAdmin.auth.admin.deleteUser(data.userId);
    } catch {
      // auth deletion may fail if user was created via OAuth; profile deletion is sufficient
    }

    return { ok: true };
  });

const addCreditsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(1).max(10_000),
  reason: z.string().max(200).optional(),
});

export const adminAddCredits = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => parseInput(addCreditsSchema, input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", data.userId)
      .maybeSingle();
    if (!profile) throw new Error("Utilisateur introuvable.");

    await supabaseAdmin
      .from("profiles")
      .update({ credits: profile.credits + data.amount })
      .eq("id", data.userId);

    await supabaseAdmin.from("credit_transactions").insert({
      user_id: data.userId,
      amount: data.amount,
      type: "admin_grant",
      description: data.reason || "Crédits ajoutés par un administrateur",
    });

    await supabaseAdmin.from("audit_logs").insert({
      user_id: data.userId,
      action: "admin_add_credits",
      target: data.userId,
      details: { amount: data.amount, reason: data.reason } as never,
    });

    return { ok: true, newCredits: profile.credits + data.amount };
  });

export const adminGetActivity = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin
        .from("audit_logs")
        .select("id, user_id, action, target, details, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return { logs: [] };
      return { logs: data ?? [] };
    } catch {
      return { logs: [] };
    }
  });

export const adminGetUsageStats = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const empty = {
      usageLogs: [] as Array<{ user_id: string; feature: string | null; model: string | null; credits: number | null; tokens: number | null; created_at: string }>,
      creditTransactions: [] as Array<{ user_id: string; amount: number; type: string; created_at: string }>,
      totalDocuments: 0,
      planBreakdown: { free: 0, pro: 0, business: 0, enterprise: 0 },
      userProfiles: [] as Array<{ id: string; full_name: string | null; email: string | null }>,
    };
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const [usageResult, creditResult, docResult, planResult, profilesResult] =
        await Promise.allSettled([
          supabaseAdmin
            .from("ai_usage_logs")
            .select("user_id, feature, model, credits, tokens, created_at")
            .order("created_at", { ascending: false })
            .limit(200),
          supabaseAdmin
            .from("credit_transactions")
            .select("user_id, amount, type, created_at")
            .order("created_at", { ascending: false })
            .limit(200),
          supabaseAdmin.from("documents").select("user_id", { count: "exact" }),
          supabaseAdmin.from("profiles").select("plan"),
          supabaseAdmin.from("profiles").select("id, full_name, email"),
        ]);

      const usageLogs =
        usageResult.status === "fulfilled" ? (usageResult.value.data ?? []) : [];
      const creditTx =
        creditResult.status === "fulfilled" ? (creditResult.value.data ?? []) : [];
      const docCount =
        docResult.status === "fulfilled" ? (docResult.value.data ?? []) : [];
      const planCounts =
        planResult.status === "fulfilled" ? (planResult.value.data ?? []) : [];
      const userProfiles =
        profilesResult.status === "fulfilled" ? (profilesResult.value.data ?? []) : [];

      const totalDocs = docCount.length;
      const planBreakdown = {
        free: planCounts.filter((p) => p.plan === "free").length,
        pro: planCounts.filter((p) => p.plan === "pro").length,
        business: planCounts.filter((p) => p.plan === "business").length,
        enterprise: planCounts.filter((p) => p.plan === "enterprise").length,
      };

      return {
        usageLogs,
        creditTransactions: creditTx,
        totalDocuments: totalDocs,
        planBreakdown,
        userProfiles,
      };
    } catch {
      return empty;
    }
  });
