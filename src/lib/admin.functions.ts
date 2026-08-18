import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, email, full_name, plan, billing_cycle, credits, credits_used, created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("user_roles").select("user_id, role"),
      ]);
    if (profilesError || rolesError) throw new Error("Erreur de chargement des utilisateurs.");
    return { users: profiles ?? [], roles: roles ?? [] };
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => roleSchema.parse(input))
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
  .inputValidator((input: unknown) => updateSchema.parse(input))
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
